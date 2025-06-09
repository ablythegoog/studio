
"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { generatePoemFromImage, type GeneratePoemFromImageOutput } from '@/ai/flows/generate-poem-from-image';
import { ImageUploader } from '@/components/image-uploader';
import { useToast } from "@/hooks/use-toast";

export default function PicturePoetPage() {
  const [uploadedImageDataUri, setUploadedImageDataUri] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [poemOutput, setPoemOutput] = useState<GeneratePoemFromImageOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [poemDisplayError, setPoemDisplayError] = useState<string | null>(null); // Separate error for poem display area
  const { toast } = useToast();

  const handleImageUploaded = useCallback((imageDataUri: string, fileName: string) => {
    if (imageDataUri && fileName) {
      setUploadedImageDataUri(imageDataUri);
      setOriginalFileName(fileName);
    } else { // Handle case where ImageUploader signals an invalid/cleared image
      setUploadedImageDataUri(null);
      setOriginalFileName(null);
    }
    setPoemOutput(null); // Clear previous poem
    setPoemDisplayError(null); // Clear poem display error
  }, []);

  const handleGeneratePoem = async () => {
    if (!uploadedImageDataUri) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first to generate a poem.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setPoemDisplayError(null);
    setPoemOutput(null); // Clear previous poem before generating new one
    try {
      const result = await generatePoemFromImage({ imageDataUri: uploadedImageDataUri });
      setPoemOutput(result);
      toast({
        title: "Poem Generated!",
        description: "Your beautiful poem is ready to be admired.",
      });
    } catch (err) {
      console.error("Poem generation error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while generating the poem. Please try again.';
      setPoemDisplayError(errorMessage);
      toast({
        title: "Generation Failed",
        description: "Could not generate poem. " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePoem = () => {
    if (!poemOutput?.poem || !originalFileName) {
       toast({
        title: "Nothing to Save",
        description: "No poem has been generated yet, or the original file name is missing.",
        variant: "destructive",
      });
      return;
    }
    // Sanitize filename
    const safeBaseFileName = originalFileName.split('.')[0].replace(/[^a-z0-9_.-]/gi, '_');
    const poemFileName = `${safeBaseFileName}_poem.txt`;
    
    const blob = new Blob([poemOutput.poem.replace(/\n/g, "\r\n")], { type: 'text/plain;charset=utf-8' }); // Ensure Windows-friendly line endings
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = poemFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); 
     toast({
        title: "Poem Saved!",
        description: `Your poem has been saved as ${poemFileName}`,
      });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8 selection:bg-accent/30 selection:text-accent-foreground">
      <header className="my-8 sm:my-12 text-center">
        <h1 className="font-headline text-5xl sm:text-6xl font-bold text-primary">Picture Poet</h1>
        <p className="text-muted-foreground mt-2 text-lg sm:text-xl font-body">Transform your photos into beautiful poems.</p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 flex-1">
        <div className="flex flex-col">
           <Card className="shadow-xl flex-grow bg-card">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2 text-card-foreground">
                <ImageIcon className="text-accent h-7 w-7" /> Upload Your Image
              </CardTitle>
              <CardDescription className="font-body text-muted-foreground">Drag & drop, or click to select an image file.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                onImageUploaded={handleImageUploaded}
                onGeneratePoem={handleGeneratePoem}
                isGenerating={isGenerating}
                currentImagePreview={uploadedImageDataUri}
              />
            </CardContent>
          </Card>
        </div>
       
        <div className="flex flex-col">
          <Card className="shadow-xl flex-grow bg-card">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2 text-card-foreground">
                <FileText className="text-accent h-7 w-7" /> Generated Poem
              </CardTitle>
              <CardDescription className="font-body text-muted-foreground">Your AI-crafted poem will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full min-h-[300px] sm:min-h-[350px]"> {/* Ensure min height for consistency */}
              {isGenerating && (
                <div className="flex flex-col items-center justify-center text-center p-8 rounded-md border border-dashed border-input min-h-[200px] flex-grow animate-pulse">
                  <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
                  <p className="text-muted-foreground font-medium font-body">Generating your masterpiece...</p>
                  <p className="text-sm text-muted-foreground font-body">This might take a moment.</p>
                </div>
              )}
              {!isGenerating && poemDisplayError && (
                 <div className="text-destructive p-4 rounded-md border border-destructive bg-destructive/10 min-h-[200px] flex-grow flex flex-col items-center justify-center text-center">
                  <p className="font-semibold font-body">Oops! Something went wrong.</p>
                  <p className="text-sm font-body">{poemDisplayError}</p>
                </div>
              )}
              {!isGenerating && !poemDisplayError && poemOutput?.poem && (
                <div className="space-y-4 flex-grow flex flex-col">
                  <Textarea
                    readOnly
                    value={poemOutput.poem}
                    className="w-full flex-grow resize-none text-base leading-relaxed bg-secondary/20 border-secondary/50 rounded-md p-4 min-h-[200px] font-body focus-visible:ring-accent"
                    rows={10}
                    aria-label="Generated poem"
                  />
                  <Button onClick={handleSavePoem} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-transform active:scale-[0.98]">
                    <Download className="mr-2 h-4 w-4" /> Save Poem
                  </Button>
                </div>
              )}
              {!isGenerating && !poemDisplayError && !poemOutput && (
                <div className="text-center text-muted-foreground p-8 rounded-md border border-dashed border-input min-h-[200px] flex-grow flex flex-col items-center justify-center">
                  {uploadedImageDataUri ? (
                    <>
                      <p className="font-medium font-body text-lg">Image Ready!</p>
                      <p className="font-body text-sm">Click "Generate Poem" in the panel to the left.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium font-body text-lg">Your Poem Awaits</p>
                      <p className="font-body text-sm">Upload an image and let Picture Poet weave its magic.</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-24 sm:mt-32 mb-8 text-center text-sm text-muted-foreground font-body">
        <p>&copy; {new Date().getFullYear()} <p></p><p></p><p></p>Picture Poet. Crafted with <span className="text-accent font-bold">&hearts;</span> by AI.</p>
      </footer>
    </div>
  );
}
