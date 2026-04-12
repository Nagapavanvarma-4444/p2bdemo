"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Basic",
      price: billingCycle === 'monthly' ? "₹0" : "₹0",
      features: ["5 Proposals per month", "Standard Profile", "Basic Support", "Email Notifications"],
      button: "Current Plan",
      color: "gray"
    },
    {
      name: "Professional",
      price: billingCycle === 'monthly' ? "₹999" : "₹9,999",
      features: ["Unlimited Proposals", "Verified Badge", "Priority Placement", "Analytics Dashboard", "Direct Chat"],
      button: "Upgrade Now",
      color: "gold",
      popular: true
    },
    {
      name: "Enterprise",
      price: billingCycle === 'monthly' ? "₹2,499" : "₹24,999",
      features: ["Bulk Team Accounts", "Lead Generation API", "API Access", "Account Manager", "Featured across site"],
      button: "Contact Sales",
      color: "navy"
    }
  ];

  return (
    <div className="auth-page" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4xl)' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Pricing & <span className="text-gold">Plans</span></h1>
          <p className="subtitle">Choose the perfect plan to grow your engineering business</p>
          
          <div style={{ 
            display: 'inline-flex', 
            background: 'rgba(255,255,255,0.05)', 
            padding: '5px', 
            borderRadius: '50px', 
            marginTop: 'var(--space-2xl)',
            border: '1px solid var(--glass-border)'
          }}>
            <button 
              className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : ''}`}
              style={{ borderRadius: '50px', border: 'none' }}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : ''}`}
              style={{ borderRadius: '50px', border: 'none' }}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
          {plans.map((plan, idx) => (
            <div key={idx} className={`dashboard-card ${plan.popular ? 'popular-scale' : ''}`} style={{ 
              padding: 'var(--space-4xl)', 
              textAlign: 'center', 
              position: 'relative',
              border: plan.popular ? '2px solid var(--gold)' : '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {plan.popular && <span style={{ 
                position: 'absolute', 
                top: '-15px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'var(--gold)',
                color: 'var(--navy-dark)',
                padding: '5px 15px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>MOST POPULAR</span>}

              <h2 style={{ marginBottom: 0 }}>{plan.name}</h2>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: 'var(--space-xl) 0' }}>{plan.price}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4xl) 0', textAlign: 'left', flex: 1 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--gold)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              <button className={`btn btn-block btn-lg ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        <div className="dashboard-card" style={{ marginTop: 'var(--space-4xl)', padding: 'var(--space-3xl)', textAlign: 'center', background: 'var(--navy-light)' }}>
          <h3>Frequently Asked Questions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', marginTop: 'var(--space-xl)', textAlign: 'left' }}>
            <div>
              <strong>Can I cancel my subscription?</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Yes, you can cancel your subscription at any time from your dashboard settings.</p>
            </div>
            <div>
              <strong>What payment methods are supported?</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>We support UPI, Credit/Debit Cards, and Net Banking across India.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .popular-scale {
          box-shadow: 0 20px 40px rgba(212,175,55,0.15) !important;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
