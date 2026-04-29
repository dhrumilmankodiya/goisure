import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { matchingApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Sparkles, 
  FileSpreadsheet, 
  Users, 
  DollarSign, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  Brain
} from 'lucide-react';

export default function AIProcessingPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('initializing');
  const [results, setResults] = useState(null);

  const phases = [
    { key: 'initializing', label: 'Initializing AI engine', duration: 1500 },
    { key: 'analyzing', label: 'Analyzing enrollment data', duration: 2000 },
    { key: 'matching', label: 'Matching member records', duration: 2500 },
    { key: 'processing', label: 'Processing claims data', duration: 3000 },
    { key: 'insights', label: 'Generating AI insights', duration: 3500 },
    { key: 'complete', label: 'Finalizing structure', duration: 1000 },
  ];

  useEffect(() => {
    let currentPhase = 0;
    
    const runPhase = async () => {
      if (currentPhase < phases.length - 1) {
        setPhase(phases[currentPhase].key);
        setProgress(Math.round((currentPhase / (phases.length - 1)) * 100));
        
        await new Promise(r => setTimeout(r, phases[currentPhase].duration));
        currentPhase++;
        runPhase();
      } else {
        // All phases complete - call the API
        setPhase('complete');
        setProgress(100);
        await processAI();
      }
    };
    
    runPhase();
  }, []);

  const processAI = async () => {
    try {
      const { data } = await matchingApi.processAI(caseId);
      setResults(data);
      setProcessing(false);
      
      // Navigate to insights page after short delay
      setTimeout(() => {
        navigate(`/cases/${caseId}/insights`, { state: { results: data } });
      }, 1500);
    } catch (error) {
      toast.error('Processing failed. Please try again.');
      setProcessing(false);
    }
  };

  const currentPhaseIndex = phases.findIndex(p => p.key === phase);
  const currentPhaseObj = phases[currentPhaseIndex] || phases[0];

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <Card className="border border-zinc-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#0055FF]/10 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-[#0055FF]" />
            </div>
            <CardTitle className="text-xl font-semibold font-['Chivo']">
              AI Processing
            </CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Structuring and analyzing your data
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 font-medium">{currentPhaseObj.label}</span>
                <span className="text-zinc-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Phase Indicators */}
            <div className="grid grid-cols-2 gap-3">
              {phases.slice(0, -1).map((p, idx) => {
                const isComplete = idx < currentPhaseIndex;
                const isCurrent = idx === currentPhaseIndex;
                return (
                  <div 
                    key={p.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      isComplete 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : isCurrent
                          ? 'bg-blue-50 border-[#0055FF] text-[#0055FF]'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                    <span className="text-xs font-medium">{p.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Current Status Highlight */}
            <div className="text-center py-4">
              {processing ? (
                <div className="animate-pulse">
                  <Sparkles className="w-6 h-6 text-[#0055FF] mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">
                    {phase === 'initializing' && 'Preparing AI model...'}
                    {phase === 'analyzing' && 'Reading enrollment records...'}
                    {phase === 'matching' && 'Matching member identities...'}
                    {phase === 'processing' && 'Computing claim patterns...'}
                    {phase === 'insights' && 'Generating underwriting insights...'}
                    {phase === 'complete' && 'Almost done...'}
                  </p>
                </div>
              ) : (
                <div className="text-emerald-600">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Processing Complete!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip Button (for testing) */}
        <div className="text-center mt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/cases/${caseId}/insights`)}
            className="text-zinc-400 hover:text-zinc-600"
          >
            Skip to results →
          </Button>
        </div>
      </div>
    </Layout>
  );
}