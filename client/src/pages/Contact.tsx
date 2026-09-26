import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, HelpCircle } from 'lucide-react';
import siteInfo from '../config/siteInfo';

/**
 * Contact page.
 *
 * NOTE: the server has no /api/contact endpoint, so rather than POST into the
 * void (and silently lose messages) the form composes a pre-filled mailto:.
 * If a real endpoint is added later, swap the body of handleSubmit for a POST.
 */
const Contact: React.FC = () => {
  const { contact } = siteInfo;
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const update = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = form.subject || `Website enquiry from ${form.name || 'a visitor'}`;
    const body = `${form.message}\n\n---\nFrom: ${form.name}\nEmail: ${form.email}`;
    window.location.href =
      `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const details = [
    {
      icon: Mail,
      label: 'Email',
      value: contact.email,
      href: `mailto:${contact.email}`
    },
    {
      icon: Phone,
      label: 'Phone',
      value: contact.phone,
      href: `tel:${contact.phoneHref}`
    },
    {
      icon: MapPin,
      label: 'Address',
      value: [contact.address.line1, contact.address.line2, contact.address.country]
        .filter(Boolean)
        .join(', '),
      href: ''
    },
    {
      icon: Clock,
      label: 'Hours',
      value: contact.hours,
      href: ''
    }
  ];

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 ' +
    'focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-eco-green-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-3 sm:py-0 sm:h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact us</h1>
              <p className="text-sm text-gray-500">
                Questions, partnerships or support - we read everything.
              </p>
            </div>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle size={16} />
              Help centre
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Reach us directly</h2>
              <ul className="space-y-5">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-eco-green-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className="text-eco-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      {href ? (
                        <a
                          href={href}
                          className="text-sm text-gray-600 hover:text-eco-green-600 transition-colors break-words"
                        >
                          {value}
                        </a>
                      ) : (
                        <div className="text-sm text-gray-600 break-words">{value}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-eco-green-100 bg-eco-green-50 p-6">
              <h3 className="font-semibold text-eco-green-900 mb-2">Already a member?</h3>
              <p className="text-sm text-eco-green-800/80 mb-4">
                Order and pickup questions are usually answered faster from your dashboard.
              </p>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-eco-green-700 hover:text-eco-green-900"
              >
                Go to dashboard &rarr;
              </Link>
            </div>
          </div>

          {/* Message form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Send a message</h2>
              <p className="text-sm text-gray-500 mb-6">
                This opens your email app with the message ready to send.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={update('name')}
                      className={inputClass}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={update('email')}
                      className={inputClass}
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={form.subject}
                    onChange={update('subject')}
                    className={inputClass}
                    placeholder="Partnership enquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={update('message')}
                    className={inputClass}
                    placeholder="Tell us what you need..."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-eco-green-600 text-white font-medium hover:bg-eco-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:ring-offset-2"
                >
                  <Send size={16} />
                  Send message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
