import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Coins, Factory, ShoppingBag, ArrowRight, Leaf, Github, Linkedin, Globe, Mail } from 'lucide-react';
import siteInfo from '../config/siteInfo';

const PILLAR_ICONS = [Recycle, Coins, Factory, ShoppingBag];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header - matches the pattern used across the app */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-3 sm:py-0 sm:h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">About {siteInfo.name}</h1>
              <p className="text-sm text-gray-500">{siteInfo.tagline}</p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-lg bg-eco-green-600 text-white text-sm font-medium hover:bg-eco-green-700 transition-colors"
            >
              Get in touch
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Mission */}
        <section className="rounded-xl border border-eco-green-100 bg-gradient-to-r from-eco-green-50 via-eco-green-50/40 to-white p-6 sm:p-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-eco-green-700">
              <Leaf size={14} />
              Our mission
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-eco-green-900">
              Recycling should pay the people who do it.
            </h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Most waste that could be recovered is thrown away, because doing the right thing costs
              time and returns nothing. {siteInfo.name} changes that trade. Every verified collection
              earns EcoTokens, every kilogram is traced from doorstep to factory floor, and the goods
              made from it come back to a marketplace where those tokens are worth something.
            </p>
            <p className="mt-3 text-gray-700 leading-relaxed">
              The result is a loop you can actually see: what you hand over, what it became, and what
              it earned you.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-1">How the loop closes</h2>
          <p className="text-sm text-gray-500 mb-6">Four steps, each one accountable to the next.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteInfo.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[i] || Recycle;
              return (
                <div
                  key={pillar.title}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-eco-green-300 transition-colors"
                >
                  <div className="w-11 h-11 rounded-lg bg-eco-green-100 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-eco-green-600" />
                  </div>
                  <div className="text-xs font-semibold text-eco-green-600 mb-1">
                    Step {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{pillar.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Who it is for */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Built for four people at once</h2>
          <p className="text-sm text-gray-500 mb-6">
            Each role gets its own dashboard, because each one needs different answers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Residents', 'Submit waste, track pickups, spend EcoTokens in the marketplace.'],
              ['Collectors', 'Plan routes, log what was collected, see earnings build up.'],
              ['Factories', 'Source verified recycled material and list the products made from it.'],
              ['Administrators', 'Approve partners, watch platform health, settle payments.']
            ].map(([role, text]) => (
              <div key={role} className="flex gap-3 rounded-lg bg-gray-50 p-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-eco-green-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{role}</div>
                  <div className="text-sm text-gray-600">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Who built it */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Who built {siteInfo.name}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {siteInfo.kind}, designed and built by two developers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {siteInfo.developers.map(dev => {
              const initials = dev.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const links = [
                { label: 'GitHub', href: dev.github, Icon: Github },
                { label: 'LinkedIn', href: dev.linkedin, Icon: Linkedin },
                { label: 'Portfolio', href: dev.portfolio, Icon: Globe },
                { label: 'Email', href: `mailto:${dev.email}`, Icon: Mail }
              ].filter(l => l.href);

              return (
                <div
                  key={dev.name}
                  className="rounded-xl border border-gray-200 p-6 text-center hover:border-eco-green-300 transition-colors"
                >
                  {dev.photo ? (
                    <img
                      src={dev.photo}
                      alt={dev.name}
                      loading="lazy"
                      className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-eco-green-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-eco-green-100 text-eco-green-700 text-2xl font-bold flex items-center justify-center mx-auto">
                      {initials}
                    </div>
                  )}

                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{dev.name}</h3>
                  <p className="text-sm text-eco-green-700">{dev.role}</p>

                  <div className="mt-4 flex justify-center gap-2">
                    {links.map(({ label, href, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        target={href.startsWith('mailto:') ? undefined : '_blank'}
                        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                        title={`${dev.name} on ${label}`}
                        aria-label={`${dev.name} on ${label}`}
                        className="w-10 h-10 rounded-lg bg-gray-50 hover:bg-eco-green-100 text-gray-500 hover:text-eco-green-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-eco-green-500"
                      >
                        <Icon size={18} />
                      </a>
                    ))}
                  </div>

                  <a
                    href={`mailto:${dev.email}`}
                    className="mt-3 inline-block text-xs text-gray-500 hover:text-eco-green-600 break-all"
                  >
                    {dev.email}
                  </a>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-gray-500">
            In development since {siteInfo.startedYear}.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-xl bg-eco-green-600 p-6 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Got waste worth something?
          </h2>
          <p className="mt-2 text-eco-green-50">
            Book a pickup and start earning EcoTokens.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/waste-submission"
              className="px-5 py-2.5 rounded-lg bg-white text-eco-green-700 font-medium hover:bg-eco-green-50 transition-colors"
            >
              Submit waste
            </Link>
            <Link
              to="/marketplace"
              className="px-5 py-2.5 rounded-lg border border-white/60 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Browse the marketplace
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
