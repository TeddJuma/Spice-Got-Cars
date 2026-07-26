import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { createSellSubmission } from "@/data/sell-submissions";
import { sendNewSubmissionEmail } from "@/lib/email";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Car - Spice Got Cars Ruaka" },
      {
        name: "description",
        content:
          "Sell your car through Spice Got Cars in Ruaka. Submit your details and our team will get back to you with an offer.",
      },
      { property: "og:title", content: "Sell Your Car with Spice Got Cars" },
      {
        property: "og:description",
        content:
          "Skip the marketplace headaches. Send us your car details and our team reviews and lists approved cars.",
      },
    ],
  }),
  component: SellPage,
});

const sellSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(20, "Phone number is too long"),
  make: z.string().trim().min(1, "Required").max(40),
  model: z.string().trim().min(1, "Required").max(60),
  year: z
    .number({ invalid_type_error: "Enter a year" })
    .int()
    .min(1980, "Too old")
    .max(new Date().getFullYear() + 1, "Year is in the future"),
  mileage: z
    .number({ invalid_type_error: "Enter mileage" })
    .int()
    .min(0)
    .max(1_000_000),
  engineCapacity: z
    .number({ invalid_type_error: "Enter engine capacity" })
    .int()
    .min(0)
    .max(10_000)
    .optional()
    .or(z.literal("")),
  condition: z.enum(["New", "Foreign Used", "Locally Used"]),
  askingPrice: z
    .number({ invalid_type_error: "Enter asking price" })
    .int()
    .min(1),
  location: z.string().trim().min(2, "Required").max(80),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type SellForm = z.infer<typeof sellSchema>;

function SellPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SellForm>({
    resolver: zodResolver(sellSchema),
    defaultValues: { condition: "Locally Used" },
  });

  const uploadPhotos = async (submissionId: string, files: File[]): Promise<string[]> => {
    const supabase = createClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `submissions/${submissionId}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("car-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Photo upload failed:", uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("car-photos").getPublicUrl(path);
      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: SellForm) => {
    try {
      console.log("[sell] submit start", data);
      const supabase = createClient();
      if (!supabase) {
        toast.error("Supabase is not configured.");
        return;
      }

      const submission = await createSellSubmission({
        name: data.name,
        phone: data.phone,
        make: data.make,
        model: data.model,
        year: data.year,
        mileageKm: data.mileage,
        engineCapacityCc: data.engineCapacity || undefined,
        condition: data.condition,
        askingPrice: data.askingPrice,
        location: data.location,
        notes: data.notes || undefined,
        photos: [],
      }, supabase);
      console.log("[sell] submission created", submission.id);

      let photoUrls: string[] = [];
      if (selectedFiles.length > 0) {
        photoUrls = await uploadPhotos(submission.id, selectedFiles);

        const { error: updateError } = await supabase
          .from("sell_submissions")
          .update({ photos: photoUrls })
          .eq("id", submission.id);

        if (updateError) {
          console.error("Failed to update submission photos:", updateError);
        }
      }

      try {
        await sendNewSubmissionEmail({
          make: data.make,
          model: data.model,
          year: data.year,
          askingPrice: data.askingPrice,
          sellerName: data.name,
          sellerPhone: data.phone,
          submissionId: submission.id,
          engineCapacityCc: data.engineCapacity || undefined,
        });
      } catch (emailErr) {
        console.error("[sell] email notification failed:", emailErr);
      }

      setSubmitted(true);
      reset();
      setSelectedFiles([]);
      toast.success("Submission received - we'll be in touch shortly.");
    } catch (err: any) {
      console.error("[sell] submit error:", err);
      const message =
        err?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-8 text-brand-accent" />
        </div>
        <h1 className="text-3xl font-bold">Thanks - we've got your details.</h1>
        <p className="mx-auto mt-3 max-w-lg text-brand-muted">
          Our team will review your car and contact you as soon as possible
          to discuss the next steps.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-lg bg-brand-navy px-6 py-3 text-sm font-bold text-white"
        >
          Submit another car
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold md:text-4xl">Sell your car</h1>
        <p className="mt-2 max-w-2xl text-brand-muted">
          Send us the details of your car. Our team reviews every submission
          and gets back to you with an offer or lists it for our nationwide
          buyer network. No public self-listing - we handle inquiries for you.
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <HowStep n={1} title="Submit details" body="Fill in your car's basics and upload photos." />
        <HowStep n={2} title="Spice Got Cars review" body="Our team validates the condition and paperwork." />
        <HowStep n={3} title="Offer or list" body="Cash offer or we list it for you within 24 hours." />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
        noValidate
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Your name" error={errors.name?.message}>
            <input
              {...register("name")}
              className="input"
              placeholder="Jane Wanjiku"
            />
          </Field>
          <Field label="Phone number" error={errors.phone?.message}>
            <input
              {...register("phone")}
              type="tel"
              className="input"
              placeholder="+254 7XX XXX XXX"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Make" error={errors.make?.message}>
            <input {...register("make")} className="input" placeholder="Toyota" />
          </Field>
          <Field label="Model" error={errors.model?.message}>
            <input {...register("model")} className="input" placeholder="Prado" />
          </Field>
          <Field label="Year" error={errors.year?.message}>
            <input
              type="number"
              inputMode="numeric"
              {...register("year", { valueAsNumber: true })}
              className="input"
              placeholder="2018"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Engine capacity (cc)" error={errors.engineCapacity?.message}>
            <input
              type="number"
              inputMode="numeric"
              {...register("engineCapacity", { valueAsNumber: true })}
              className="input"
              placeholder="2000"
            />
          </Field>
          <Field label="Mileage (km)" error={errors.mileage?.message}>
            <input
              type="number"
              inputMode="numeric"
              {...register("mileage", { valueAsNumber: true })}
              className="input"
              placeholder="60000"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Condition" error={errors.condition?.message}>
            <select {...register("condition")} className="input">
              <option value="New">New</option>
              <option value="Foreign Used">Foreign Used</option>
              <option value="Locally Used">Locally Used</option>
            </select>
          </Field>
          <Field label="Asking price (KES)" error={errors.askingPrice?.message}>
            <input
              type="number"
              inputMode="numeric"
              {...register("askingPrice", { valueAsNumber: true })}
              className="input"
              placeholder="2500000"
            />
          </Field>
        </div>

        <Field label="Your location" error={errors.location?.message}>
          <input
            {...register("location")}
            className="input"
            placeholder="Ruaka, Kiambu"
          />
        </Field>

        <Field label="Extra notes (optional)" error={errors.notes?.message}>
          <textarea
            {...register("notes")}
            className="input min-h-24"
            placeholder="Anything else we should know?"
          />
        </Field>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-navy">
            Photos (optional)
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-accent">
            <Upload className="size-4" />
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : "Tap to add photos"}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setSelectedFiles(files);
              }}
            />
          </label>
          {selectedFiles.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-brand-muted">
              {selectedFiles.map((f, idx) => (
                <li key={idx}>• {f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-brand-accent px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition-colors hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Submitting...
            </span>
          ) : (
            "Submit for review"
          )}
        </button>

        <p className="text-center text-xs text-brand-muted">
          By submitting, you agree that a Spice Got Cars representative may contact you
          about your listing.
        </p>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: #fff;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgb(5 150 105 / 0.15); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-brand-navy">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function HowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 grid size-8 place-items-center rounded-full bg-brand-accent text-sm font-bold text-white">
        {n}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-brand-muted">{body}</p>
    </div>
  );
}