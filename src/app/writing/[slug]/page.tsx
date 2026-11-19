import type { Metadata } from "next";
import {
  postMetadata,
  postStaticParams,
  SectionPost,
} from "@/components/section-post";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return postStaticParams("writing");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return postMetadata("writing", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <SectionPost section="writing" slug={(await params).slug} />;
}
