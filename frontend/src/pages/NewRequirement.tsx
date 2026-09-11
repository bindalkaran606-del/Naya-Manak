import { useEffect, useRef, useState } from "react";
 import { useNavigate, useLocation } from "react-router-dom";
 import { 
   FileText, 
   Upload, 
   ArrowRight, 
   FileCheck, 
   X, 
   ShieldCheck
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
 import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
 import { Header } from "@/components/Header";
 import { Footer } from "@/components/Footer";
 import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
 import { manakApi } from "@/services/manakApi";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { toast } from "sonner";
 import type { PresetRequirement } from "@/types/standards";
 
 export default function NewRequirement() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
   useEffect(() => () => timers.current.forEach(clearTimeout), []);
   const location = useLocation();
 
   const state = location.state as {
     initialText?: string;
     initialTitle?: string;
     initialSector?: string;
     initialDept?: string;
     initialScheme?: string;
     initialDocName?: string;
     openUploadTab?: boolean;
   } | null;
 
   const [activeTab, setActiveTab] = useState<string>(
     state?.openUploadTab ? "upload" : "text"
   );
   const [requirementText, setRequirementText] = useState<string>(
     state?.initialText || ""
   );
   const [title, setTitle] = useState<string>(state?.initialTitle || "");
   const [sector, setSector] = useState<string>(state?.initialSector || "General");
   const [department, setDepartment] = useState<string>(
     state?.initialDept || "Electrotechnical Department (ETD), BIS"
   );
   const [schemeRef, setSchemeRef] = useState<string>(
     state?.initialScheme || "Scheme-I · ISI Mark"
   );
   const [uploadedFileName, setUploadedFileName] = useState<string | null>(
     state?.initialDocName || null
   );
 
   const [transparencyOpen, setTransparencyOpen] = useState(false);
   const [processingState, setProcessingState] = useState<number | null>(null);
 
   const { data: presets } = useQuery({
     queryKey: ["presets"],
     queryFn: manakApi.getPresets,
   });
 
   const analyzeMutation = useMutation({
     mutationFn: manakApi.analyzeRequirement,
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["analyses"] });
       queryClient.invalidateQueries({ queryKey: ["stats"] });
       if (data.outcome !== "matched") {
         setProcessingState(null);
         navigate(`/analysis/${data.id}`);
         return;
       }
       // Step through the 4 refined pipeline states smoothly
       setProcessingState(1);
       timers.current.push(setTimeout(() => setProcessingState(2), 150));
       timers.current.push(setTimeout(() => setProcessingState(3), 300));
       timers.current.push(setTimeout(() => setProcessingState(4), 450));
       timers.current.push(setTimeout(() => {
         setProcessingState(null);
         navigate(`/analysis/${data.id}`, { replace: true });
       }, 650));
     },
     onError: (err: any) => {
       setProcessingState(null);
       toast.error(typeof err?.body?.detail === "string" ? err.body.detail : "We couldn’t analyze this requirement. Your text is still here; please try again.");
     },
   });
 
   const handleSubmit = () => {
     if (!requirementText.trim() || requirementText.trim().length < 10) {
       toast.error("Please enter a procurement requirement of at least 10 characters.");
       return;
     }
 
     setProcessingState(1);
     analyzeMutation.mutate({
       title: title.trim() || undefined,
       sector: sector,
       department: department,
       conformity_scheme: schemeRef,
       source_type: activeTab === "upload" ? "pdf_upload" : "text",
       raw_text: requirementText,
       document_name: uploadedFileName || (activeTab === "upload" ? "Tender_Document_Attached.pdf" : undefined),
     });
   };
 
   const handleSelectPreset = (preset: PresetRequirement) => {
     setTitle(preset.title);
     setSector(preset.sector);
     setDepartment(preset.department);
     setSchemeRef(preset.conformity_scheme);
     setRequirementText(preset.sample_text);
     setUploadedFileName(preset.document_name);
     toast.success(`Loaded sample: ${preset.title}`);
   };
 
   const handleSimulatePdfUpload = (fileName: string, sampleContent: string, presetTitle: string) => {
     setUploadedFileName(fileName);
     setRequirementText(sampleContent);
     setTitle(presetTitle);
     toast.success(`Loaded demonstration document: ${fileName}`);
   };
 
   return (
     <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
       <Header onOpenTransparency={() => setTransparencyOpen(true)} />
 
       <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
         {/* Step Indicator / Breadcrumb */}
         <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
           <button onClick={() => navigate("/dashboard")} className="hover:text-[#0B132B]">
             Dashboard
           </button>
           <span>/</span>
           <span className="text-[#0B132B] font-semibold">New requirement</span>
         </div>
 
         {/* Page Header */}
         <div className="space-y-2 border-b border-[#E5DFD5] pb-6">
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B132B]">
             New procurement requirement
           </h1>
           <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
             Describe the product, material and intended use. We’ll check the available catalog and ask for clarification when the requirement is too broad.
           </p>
         </div>
 
         {/* Processing Pipeline Modal Overlay */}
         {processingState !== null && (
           <Dialog open>
             <DialogContent showCloseButton={false} className="p-8 sm:max-w-md w-[calc(100%-2rem)] space-y-6" data-testid="analysis-processing-dialog">
               <div className="w-12 h-12 rounded-sm bg-[#B81D24] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
                 IS
               </div>
 
               <div className="space-y-1">
                 <DialogTitle className="text-base font-bold text-[#0B132B]" data-testid="analysis-processing-title">Reviewing your requirement</DialogTitle>
                 <DialogDescription className="text-sm text-slate-500" data-testid="analysis-processing-description">Checking the available catalog · Demo workflow</DialogDescription>
               </div>
 
               {/* Progress Steps List */}
               <div className="space-y-3 text-left text-xs bg-[#FAF8F5] p-4 rounded-sm border border-[#E5DFD5]">
                 <div className={`flex items-center gap-3 transition-colors ${processingState >= 1 ? "text-[#0B132B] font-semibold" : "text-slate-400"}`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${processingState >= 1 ? "bg-[#B81D24] text-white" : "bg-slate-200 text-slate-500"}`}>
                     {processingState > 1 ? "✓" : "1"}
                   </div>
                   <span>Understanding requirement & parameters</span>
                 </div>
 
                 <div className={`flex items-center gap-3 transition-colors ${processingState >= 2 ? "text-[#0B132B] font-semibold" : "text-slate-400"}`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${processingState >= 2 ? "bg-[#B81D24] text-white" : "bg-slate-200 text-slate-500"}`}>
                     {processingState > 2 ? "✓" : "2"}
                   </div>
                   <span>Finding relevant Indian Standards</span>
                 </div>
 
                 <div className={`flex items-center gap-3 transition-colors ${processingState >= 3 ? "text-[#0B132B] font-semibold" : "text-slate-400"}`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${processingState >= 3 ? "bg-[#B81D24] text-white" : "bg-slate-200 text-slate-500"}`}>
                     {processingState > 3 ? "✓" : "3"}
                   </div>
                   <span>Ranking recommendations & clauses</span>
                 </div>
 
                 <div className={`flex items-center gap-3 transition-colors ${processingState >= 4 ? "text-[#0B132B] font-semibold" : "text-slate-400"}`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${processingState >= 4 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                     {processingState > 4 ? "✓" : "4"}
                   </div>
                   <span>Preparing MANAK Insight & Gap Analysis</span>
                 </div>
               </div>
 
               <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                 <div 
                   className="bg-[#B81D24] h-full transition-[width] duration-150"
                   style={{ width: `${(processingState / 4) * 100}%` }}
                 />
               </div>
             </DialogContent>
           </Dialog>
         )}
 
         {/* Quick Sample Presets Loader */}
         <div className="bg-[#F3EFEA] border border-[#E5DFD5] rounded-sm p-4 space-y-2.5">
           <div className="flex items-center justify-between">
             <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B132B]">
               Start with an example requirement
             </span>
             <span className="text-[11px] text-slate-500 hidden sm:inline">
               Editable examples
             </span>
           </div>
 
           <div className="flex flex-wrap gap-2">
             {presets?.map((p) => (
               <button
                 key={p.id}
                 type="button"
                 onClick={() => handleSelectPreset(p)}
                 className="text-xs px-3 py-1.5 rounded-sm bg-white hover:bg-slate-100 border border-[#E5DFD5] text-[#0B132B] font-medium transition-colors shadow-xs"
                 data-testid={`quick-sample-button-${p.id}`}
               >
                 {p.title.split(" &")[0]}
               </button>
             ))}
           </div>
         </div>
 
         {/* Main Dual-Input Workspace */}
         <div className="bg-white rounded-sm border border-[#E5DFD5] shadow-sm p-6 sm:p-8 space-y-6">
           {/* Metadata Row */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div>
               <label className="block text-xs font-mono uppercase text-slate-500 mb-1 font-semibold">
                 Requirement title
               </label>
               <input
                 type="text"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="e.g. LED Street Lighting Tender 2026"
                 className="w-full text-xs p-2.5 rounded-sm border border-[#E5DFD5] bg-[#FAF8F5] focus:ring-1 focus:ring-[#B81D24] focus:outline-none"
                 data-testid="input-requirement-title"
               />
             </div>
 
             <div>
               <label className="block text-xs font-mono uppercase text-slate-500 mb-1 font-semibold">
                 BIS technical department
               </label>
               <input
                 type="text"
                 value={department}
                 onChange={(e) => setDepartment(e.target.value)}
                 placeholder="e.g. CPWD, NHAI, Jal Jeevan"
                 className="w-full text-xs p-2.5 rounded-sm border border-[#E5DFD5] bg-[#FAF8F5] focus:ring-1 focus:ring-[#B81D24] focus:outline-none"
                 data-testid="input-requirement-department"
               />
             </div>
 
             <div>
               <label className="block text-xs font-mono uppercase text-slate-500 mb-1 font-semibold">
                 Sector
               </label>
               <select
                 value={sector}
                 onChange={(e) => setSector(e.target.value)}
                 className="w-full text-xs p-2.5 rounded-sm border border-[#E5DFD5] bg-[#FAF8F5] focus:ring-1 focus:ring-[#B81D24] focus:outline-none"
                 data-testid="select-requirement-sector"
               >
                 <option value="Electrotechnical & Smart Infrastructure">Electrotechnical & Smart Infrastructure</option>
                 <option value="Civil Engineering & Structural">Civil Engineering & Structural</option>
                 <option value="Occupational Safety & Mining">Occupational Safety & Mining</option>
                 <option value="Public Health & Water Utilities">Public Health & Water Utilities</option>
                 <option value="Power Systems & Electrical Utilities">Power Systems & Electrical Utilities</option>
                 <option value="General">General Procurement</option>
               </select>
             </div>
           </div>
 
           {/* Dual Mode Tabs */}
           <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
             <TabsList className="bg-[#FAF8F5] border border-[#E5DFD5] p-1 rounded-sm">
               <TabsTrigger 
                 value="text" 
                 className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                 data-testid="tab-trigger-text-input"
               >
                 Enter text
               </TabsTrigger>
               <TabsTrigger 
                 value="upload" 
                 className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                 data-testid="tab-trigger-pdf-upload"
               >
                 PDF demonstration
               </TabsTrigger>
             </TabsList>
 
             {/* Tab 1: Text Input */}
             <TabsContent value="text" className="space-y-3 pt-2">
               <label className="block text-xs font-mono uppercase text-slate-500 font-semibold">
                 Procurement requirement
               </label>
               <textarea
                 value={requirementText}
                 onChange={(e) => setRequirementText(e.target.value)}
                 rows={10}
                 placeholder="Paste the technical specification, scope of work, bill of quantities (BOQ), or Notice Inviting Tender (NIT) paragraph here..."
                 className="w-full p-4 text-xs font-mono text-slate-800 bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#B81D24] focus:border-[#B81D24] resize-y leading-relaxed"
                 data-testid="textarea-requirement-full-text"
               />
             </TabsContent>
 
             {/* Tab 2: PDF Upload Workspace */}
             <TabsContent value="upload" className="space-y-4 pt-2">
               <div className="border-2 border-dashed border-[#E5DFD5] hover:border-[#B81D24] rounded-sm p-8 text-center space-y-4 bg-[#FAF8F5]/50 transition-colors">
                 <div className="w-12 h-12 rounded-full bg-white border border-[#E5DFD5] flex items-center justify-center mx-auto text-slate-600 shadow-xs">
                   <Upload className="w-6 h-6 text-[#B81D24]" />
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-sm font-bold text-[#0B132B]">
                     Preview a requirement document
                   </h4>
                   <p className="text-xs text-slate-500">
                     PDF parsing is simulated in this version. Choose an existing example below, or paste your own document text in the text tab.
                   </p>
                 </div>
 
                 {/* Pre-Loaded Tender PDF Options */}
                 <div className="pt-2">
                   <span className="text-[11px] font-mono text-slate-500 block mb-2">
                     Or select a sample requirement document to simulate upload:
                   </span>
                   <div className="flex flex-wrap justify-center gap-2">
                     {presets?.slice(0, 3).map((p) => (
                       <button
                         key={p.id}
                         type="button"
                         onClick={() => handleSimulatePdfUpload(p.document_name, p.sample_text, p.title)}
                         className="text-[11px] px-3 py-1.5 rounded bg-white hover:bg-[#F3EFEA] border border-[#E5DFD5] text-[#0B132B] font-mono flex items-center gap-1.5 shadow-xs"
                         data-testid={`simulate-pdf-${p.id}`}
                       >
                         <FileText className="w-3.5 h-3.5 text-[#B81D24]" />
                         <span>{p.document_name}</span>
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
 
               {uploadedFileName && (
                 <div className="p-4 bg-[#F3EFEA] border border-[#E5DFD5] rounded-sm flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2 font-mono">
                     <FileCheck className="w-4 h-4 text-emerald-700" />
                     <span className="font-semibold text-[#0B132B]">{uploadedFileName}</span>
                     <span className="text-slate-500">(Demo content loaded)</span>
                   </div>
                   <Button
                     variant="ghost"
                     size="xs"
                     onClick={() => {
                       setUploadedFileName(null);
                       setRequirementText("");
                     }}
                     className="text-slate-500 hover:text-rose-600"
                   >
                     <X className="w-3.5 h-3.5" />
                   </Button>
                 </div>
               )}
 
               {requirementText && (
                 <div className="space-y-1">
                   <span className="text-[11px] font-mono text-slate-500 uppercase">
                     Extracted Document Content Preview
                   </span>
                   <div className="p-3 bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm text-xs font-mono text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
                     {requirementText}
                   </div>
                 </div>
               )}
             </TabsContent>
           </Tabs>
 
           {/* Bottom Action Footer */}
           <div className="pt-4 border-t border-[#E5DFD5] flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
               <ShieldCheck className="w-4 h-4 text-[#B81D24]" />
               <span>Checks only the available IS catalog · Human review required</span>
             </div>
 
             <Button
               onClick={handleSubmit}
               disabled={analyzeMutation.isPending || processingState !== null}
               size="lg"
               className="w-full sm:w-auto bg-[#B81D24] hover:bg-[#991319] text-white px-8 py-6 text-sm font-semibold shadow-md flex items-center justify-center gap-2"
               data-testid="new-requirement-analyze-button"
             >
               <span>{analyzeMutation.isPending || processingState !== null ? "Analyzing…" : "Analyze requirement"}</span>
               <ArrowRight className="w-4 h-4" />
             </Button>
           </div>
         </div>
       </main>
 
       <Footer />
 
       <ModelTransparencyModal
         open={transparencyOpen}
         onOpenChange={setTransparencyOpen}
       />
     </div>
   );
 }
