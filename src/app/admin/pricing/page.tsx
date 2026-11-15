import { connection } from "next/server";
import { updateTier } from "../actions";
import { Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { PRICE_UNIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminPricingPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const tiers = await prisma.pricingTier.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }] });

  return (
    <div>
      <PageHeader title="Pricing" description={`These tiers apply to every course and are shown to visitors as the price ${PRICE_UNIT}.`} />
      <ErrorBanner message={firstString(params.error)} />

      <div className="space-y-4">
        {tiers.map((t) => (
          <Card key={t.id} className="p-5">
            <form key={t.price + t.name + t.ratio + t.description} action={updateTier} className="grid gap-4 sm:grid-cols-[1fr_1fr_10rem]">
              <input type="hidden" name="id" value={t.id} />
              <Field label="Tier name"><input name="name" defaultValue={t.name} required className={inputClass} /></Field>
              <Field label="Students : tutor"><input name="ratio" defaultValue={t.ratio} required className={inputClass} /></Field>
              <Field label="Price (NGN)"><input name="price" type="number" min={0} step={500} defaultValue={t.price} required className={inputClass} /></Field>
              <div className="sm:col-span-2"><Field label="Description"><input name="description" defaultValue={t.description} required className={inputClass} /></Field></div>
              <div className="flex items-end"><SubmitButton>Save</SubmitButton></div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
