import React, { useState } from 'react';
import Section from '../ui/Section';
import Button from '../ui/Button';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email required';
    }
    if (!formData.message.trim()) errors.message = 'Message is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/sendMail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Server did not return JSON response');
        }

        const data = await response.json();

        if (response.ok && data?.status === 'success') {
          setFormSubmitted(true);
          setFormData({ name: '', email: '', message: '' });
          setTimeout(() => setFormSubmitted(false), 5000);
        } else {
          setFormErrors({ submit: data?.message || 'Failed to send message. Please try again.' });
        }
      } catch (error) {
        console.error('Failed to send email:', error);
        setFormErrors({ submit: 'Failed to send message. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setFormErrors(errors);
    }
  };

  return (
    <Section id="contact" background="secondary">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Let's Build Something Meaningful Together
          </h2>
          <p className="text-xl text-shakya-text-secondary">
            Have a project in mind? We'd love to hear from you and discuss how we can help bring your vision to life.
          </p>
        </div>
        
        <div className="bg-shakya-bg-card rounded-2xl p-8 md:p-12 border border-shakya-border shadow-card">
          {formSubmitted && (
            <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg text-center font-semibold mb-6">
              ✓ Thank you! We'll be in touch soon.
            </div>
          )}
          
          {formErrors.submit && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg text-center mb-6">
              {formErrors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-shakya-bg-secondary border ${
                  formErrors.name ? 'border-red-500' : 'border-shakya-border'
                } text-white placeholder-shakya-text-secondary focus:outline-none focus:ring-2 focus:ring-shakya-cyan focus:border-transparent`}
                placeholder="John Doe"
              />
              {formErrors.name && <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-shakya-bg-secondary border ${
                  formErrors.email ? 'border-red-500' : 'border-shakya-border'
                } text-white placeholder-shakya-text-secondary focus:outline-none focus:ring-2 focus:ring-shakya-cyan focus:border-transparent`}
                placeholder="john@example.com"
              />
              {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                Tell us about your project *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="5"
                className={`w-full px-4 py-3 rounded-lg bg-shakya-bg-secondary border ${
                  formErrors.message ? 'border-red-500' : 'border-shakya-border'
                } text-white placeholder-shakya-text-secondary focus:outline-none focus:ring-2 focus:ring-shakya-cyan focus:border-transparent resize-none`}
                placeholder="Describe your project, goals, timeline, and any specific requirements..."
              ></textarea>
              {formErrors.message && <p className="text-red-400 text-sm mt-1">{formErrors.message}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? '⏳ Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </Section>
  );
};

export default ContactSection;
