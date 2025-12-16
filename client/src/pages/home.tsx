import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import shaktiImg from "@assets/Picsart_25-12-16_18-16-30-724_1765911686574.png";
import monsterImg from "@assets/Picsart_25-12-16_16-08-38-272_1765911686514.png";
import bgImg from "@assets/file_00000000ab0872069c039a5e50504181_1765912257095.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-orange-50 relative overflow-hidden font-sans flex flex-col">
      {/* Background Decor */}
      <div 
        className="absolute inset-0 opacity-30 z-0" 
        style={{ 
          backgroundImage: `url(${bgImg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }} 
      />

      <main className="flex-1 container mx-auto px-4 py-8 z-10 flex flex-col items-center justify-center text-center">
        
        {/* Title Badge */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-primary text-white px-6 py-2 rounded-full font-black tracking-widest text-sm shadow-lg mb-8 border-2 border-white"
        >
          OFFICIAL GAME
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-6xl md:text-8xl font-black text-secondary drop-shadow-[4px_4px_0px_rgba(255,165,0,0.5)] mb-6 leading-tight"
        >
          AMRITA<br />
          <span className="text-primary">WINNERS</span>
        </motion.h1>

        {/* Character Scene */}
        <div className="relative h-64 w-full max-w-2xl mx-auto mb-8 flex items-end justify-center gap-8 md:gap-20">
          <motion.div
             initial={{ x: -100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="relative w-40 h-40 md:w-56 md:h-56"
          >
             <div className="absolute -top-16 -right-12 bg-white p-4 rounded-2xl rounded-bl-none shadow-xl border-2 border-slate-100 max-w-[200px] z-20">
                <p className="text-sm font-bold text-slate-700 leading-tight">
                  "Hey I am Shakti, will I be able to escape from this evil cheery or not? Let's see..."
                </p>
             </div>
             <img src={shaktiImg} alt="Shakti" className="w-full h-full object-contain" />
          </motion.div>

          <motion.div
             initial={{ x: 100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="w-48 h-48 md:w-64 md:h-64 opacity-90"
          >
             <img src={monsterImg} alt="Chirag" className="w-full h-full object-contain transform scale-x-[-1]" />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/game">
            <Button 
              size="lg" 
              className="text-2xl h-20 px-12 rounded-2xl font-black shadow-[0px_8px_0px_0px_#c2410c] hover:shadow-[0px_4px_0px_0px_#c2410c] hover:translate-y-[4px] transition-all bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-t-2 border-white/30"
            >
              START RUNNING!
            </Button>
          </Link>
          <p className="mt-6 text-slate-500 font-bold text-sm tracking-wide uppercase">
            Tap SPACE to Jump • Collect Coins • Don't get caught
          </p>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-400 text-xs font-medium z-10">
        © 2024 Amrita Winners • Made with ❤️ in Replit
      </footer>
    </div>
  );
}
