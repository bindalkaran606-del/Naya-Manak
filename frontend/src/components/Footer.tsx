import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ExternalLink, FileCheck, Scale } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[#E5DFD5] bg-[#FAF8F5] text-slate-600 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#E5DFD5]">
          {/* Col 1: Institutional Authority */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0B132B] text-sm border-l-2 border-[#B81D24] pl-2">
                MANAK <span className="text-[#B81D24]">AI</span>
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Indian Standards research and specification review for procurement teams. An independent academic prototype.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              SIH 2026 Problem ID: SIH 26108
            </div>
          </div>

          {/* Col 2: Procurement Standards */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[#0B132B] text-xs uppercase tracking-wider font-mono">
              Standards resources
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://www.bis.gov.in/?lang=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B81D24] flex items-center gap-1 transition-colors"
                >
                  Bureau of Indian Standards (BIS)
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://gem.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B81D24] flex items-center gap-1 transition-colors"
                >
                  Government e-Marketplace (GeM)
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <Link to="/standards" className="hover:text-[#B81D24] transition-colors">
                  IS Standards Directory
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Quality Control Orders (QCO)</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & GFR Compliance */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[#0B132B] text-xs uppercase tracking-wider font-mono">
              Procurement context
            </h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>General Financial Rules (GFR 2017) Rule 144</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>Bureau of Indian Standards Act, 2016</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Mandatory ISI / CRS Certification</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Human-in-the-Loop Oversight Principle */}
          <div className="space-y-2 bg-[#F3EFEA] p-3.5 rounded-sm border border-[#E5DFD5]">
            <div className="flex items-center gap-1.5 text-[#0B132B] font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-[#B81D24]" />
              <span>Human review comes first</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              MANAK AI assists procurement officers with standards discovery and gap analysis. Final technical specification formulation and vendor compliance remain under human executive authority.
            </p>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-6 space-y-3 text-[11px] text-slate-500 font-mono">
          <p className="text-center sm:text-left leading-relaxed" data-testid="footer-bis-attribution">
            Standard numbers, titles, technical departments, Quality Control Order status and conformity assessment
            scheme references are sourced from the Bureau of Indian Standards (bis.gov.in) — the National Standards
            Body of India established under the BIS Act, 2016. This prototype indexes a curated subset of Indian
            Standards across selected categories and is designed to scale; it is not a complete catalogue of Indian
            Standards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>© 2026 MANAK AI · Developed for Smart India Hackathon 2026 (SIH 26108)</div>
            <div className="flex items-center gap-4">
              <span>Independent project · Not an official BIS service</span>
              <span>·</span>
              <span>New Delhi, India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
