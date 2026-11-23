import type { Metadata } from "next";
import { PortfolioBoard } from "@/components/console/portfolio-board";

export const metadata: Metadata = { title: "Proyectos" };

export default function ProjectsPage() {
  return <PortfolioBoard />;
}
