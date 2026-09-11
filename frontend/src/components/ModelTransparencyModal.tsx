import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Database, Scale, Cpu, AlertCircle, ExternalLink } from "lucide-react";

interface ModelTransparencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ModelTransparencyModal: React.FC<ModelTransparencyModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(95vw,52rem)] sm:max-w-[52rem] max-h-[85vh] overflow-y-auto bg-[#FAF8F5] border-[#E5DFD5] p-6">
        <DialogHeader className="border-b border-[#E5DFD5] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#B81D24] text-white flex items-center justify-center font-bold text-sm">
              IS
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0B132B]">
                Scope and sources
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono">
                Smart India Hackathon 2026 · Problem Statement SIH 26108
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 text-xs text-slate-700 leading-relaxed">
          {/* Section 1: Core Methodology */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#0B132B] text-sm">
              <Cpu className="w-4 h-4 text-[#B81D24]" />
              <span>1. How this version works</span>
            </div>
            <p className="text-slate-600">
              This checked-out version uses a mock heuristic analysis engine and an existing MongoDB catalog. It does not call a live LLM or vector retrieval service. Catalog references are the source for standard identities and evidence; demonstration scores and gap suggestions are not verified compliance findings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-sm border border-[#E5DFD5]">
                <span className="font-semibold text-[#B81D24] block">Requirement review</span>
                <span className="text-sm text-slate-600">Narrow product checks protect the existing demo profiles from unrelated or ambiguous queries.</span>
              </div>
              <div className="p-3 bg-white rounded-sm border border-[#E5DFD5]">
                <span className="font-semibold text-[#0B132B] block">Catalog lookup</span>
                <span className="text-sm text-slate-600">Product templates browse existing records. They do not synthesize IS numbers or substitute for semantic RAG.</span>
              </div>
              <div className="p-3 bg-white rounded-sm border border-[#E5DFD5]">
                <span className="font-semibold text-[#0B132B] block">Catalog-backed references</span>
                <span className="text-sm text-slate-600">New recommendations use titles, status and clause summaries from stored records. Check the official publication before use.</span>
              </div>
              <div className="p-3 bg-white rounded-sm border border-[#E5DFD5]">
                <span className="font-semibold text-[#0B132B] block">MANAK Insight</span>
                <span className="text-sm text-slate-600">Existing demonstration gaps remain available for supported profiles. No gaps or scores are invented for unmatched requirements.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Knowledge Base Scope */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#0B132B] text-sm">
              <Database className="w-4 h-4 text-[#B81D24]" />
              <span>2. A curated collection, not complete BIS coverage</span>
            </div>
            <p className="text-slate-600">
              The catalog contains selected procurement standards. Product shortcuts may have no matching records; this does not mean a standard does not exist outside this collection.
            </p>
            <div className="p-3.5 bg-[#F3EFEA] rounded-sm border border-[#E5DFD5] space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div>• Electrotechnical (ETD)</div>
                <div>• Civil Engineering (CED)</div>
                <div>• Mechanical Engineering (MED)</div>
                <div>• Chemical Engineering (CHD)</div>
                <div>• Water Supply & Piping</div>
                <div>• Personal Protective Gear</div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-[#E5DFD5]">
                Catalog availability is not proof of applicability. Status, clauses and Quality Control Orders should be checked with BIS before finalizing a specification.
              </p>
            </div>
          </div>

          {/* Section 3: Legal & Regulatory Framework */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#0B132B] text-sm">
              <Scale className="w-4 h-4 text-[#B81D24]" />
              <span>3. Procurement context</span>
            </div>
            <p className="text-slate-600">
              Use this tool to support research for procurement specifications. It does not guarantee compliance with the General Financial Rules, Quality Control Orders or certification requirements, and it is not an official BIS service.
            </p>
          </div>

          {/* Section 4: Human-in-the-Loop Principle */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>The procurement officer makes the final decision</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              MANAK AI is strictly designed as an intelligent decision-support instrument for procurement committees. It generates evidence-backed recommendations and flags specification ambiguities, but does not replace the human judgment of authorized procurement officers.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-[#E5DFD5] pt-4">
          <div className="flex items-center justify-between w-full">
            <a
              href="https://www.bis.gov.in/?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#B81D24] hover:underline flex items-center gap-1 font-mono"
            >
              Visit the official BIS website
              <ExternalLink className="w-3 h-3" />
            </a>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-[#0B132B] text-white text-xs"
              data-testid="transparency-modal-done-button"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
