import React from 'react';

interface DashboardBannerProps {
  /** Greeting headline, e.g. "Welcome back, Sampada" */
  title: string;
  /** One line describing what this role does here */
  subtitle: string;
  /** Path to the role illustration under /public/images */
  image: string;
}

/**
 * Role banner shown at the top of each dashboard's main content area.
 *
 * The illustration is decorative - the heading and subtitle already carry the
 * meaning - so it is marked aria-hidden and given an empty alt to keep it out
 * of the accessibility tree rather than having screen readers announce it.
 */
const DashboardBanner: React.FC<DashboardBannerProps> = ({ title, subtitle, image }) => (
  <div className="mb-8 overflow-hidden rounded-xl border border-eco-green-100 bg-gradient-to-r from-eco-green-50 via-eco-green-50/40 to-white">
    <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-eco-green-900 truncate">
          {title}
        </h2>
        <p className="mt-1 text-sm text-eco-green-700/80">
          {subtitle}
        </p>
      </div>

      {/* Hidden on small screens, where the text should get the full width */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="hidden sm:block h-24 lg:h-32 w-auto shrink-0 select-none pointer-events-none"
      />
    </div>
  </div>
);

export default DashboardBanner;
