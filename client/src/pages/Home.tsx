import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Recycle, Truck, Factory, ShoppingBag, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const counterAnimation = useAnimation();
  const [statsRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Animated counter values
  const ecoCoinsRef = useRef<HTMLSpanElement>(null);
  const plasticRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (inView) {
      counterAnimation.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
      });
      
      // Animate counters
      animateCounter(ecoCoinsRef.current, 0, 125000, 2000);
      animateCounter(plasticRef.current, 0, 75, 2000, 'tons');
    }
  }, [inView, counterAnimation]);
  
  const animateCounter = (
    element: HTMLElement | null, 
    start: number, 
    end: number, 
    duration: number,
    suffix: string = ''
  ) => {
    if (!element) return;
    
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      element.textContent = current.toLocaleString() + (suffix ? ` ${suffix}` : '');
      
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  };

  return (
    <div className=" bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/2 mb-12 md:mb-0 md:pr-12"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
                <span className="text-eco-green">Recycle.</span> <span className="text-eco-yellow">Earn.</span> <span className="text-eco-green">Sustain.</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-lg">
                Join our eco-friendly blockchain platform that rewards sustainable waste management and recycling efforts.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/register" 
                  className="px-6 py-3 bg-eco-green hover:bg-eco-green-dark text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/marketplace" 
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-eco-green border border-eco-green font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Marketplace
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:w-1/2"
            >
              <img 
                src="/images/recycling-illustration.png" 
                alt="Recycling waste illustration" 
                className="w-full h-auto max-w-lg mx-auto drop-shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">How EcoChain Works</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">Our circular economy approach connects users, collectors, factories, and marketplaces in a sustainable ecosystem.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Recycle className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">User</h3>
              <p className="text-gray-700 text-center">Users collect and sort recyclable waste, then schedule pickups through the app.</p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Truck className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Collector</h3>
              <p className="text-gray-700 text-center">Collectors pick up the waste and transport it to recycling facilities.</p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Factory className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Factory</h3>
              <p className="text-gray-700 text-center">Factories process the waste into new recycled products and materials.</p>
            </motion.div>
            
            {/* Step 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <ShoppingBag className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Marketplace</h3>
              <p className="text-gray-700 text-center">Products are sold in our marketplace, completing the circular economy.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Impact Section */}
      <section 
        ref={statsRef} 
        className="py-20 bg-eco-green text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={counterAnimation}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Our Impact</h2>
            <p className="text-xl max-w-3xl mx-auto">Together we're making a difference for our planet.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={counterAnimation}
              className="bg-white bg-opacity-10 rounded-xl p-8 text-center backdrop-blur-sm"
            >
              <h3 className="text-5xl md:text-6xl font-bold mb-2">
                <span ref={ecoCoinsRef}>0</span>
              </h3>
              <p className="text-xl">Eco Coins Distributed</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={counterAnimation}
              className="bg-white bg-opacity-10 rounded-xl p-8 text-center backdrop-blur-sm"
            >
              <h3 className="text-5xl md:text-6xl font-bold mb-2">
                <span ref={plasticRef}>0</span>
              </h3>
              <p className="text-xl">Plastic Recycled</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;