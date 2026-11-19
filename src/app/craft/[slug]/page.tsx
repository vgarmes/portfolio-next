import type { Metadata } from "next";
import {
  postMetadata,
  postStaticParams,
  SectionPost,
} from "@/components/section-post";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return postStaticParams("craft");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return postMetadata("craft", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <SectionPost section="craft" slug={(await params).slug} />;
}
