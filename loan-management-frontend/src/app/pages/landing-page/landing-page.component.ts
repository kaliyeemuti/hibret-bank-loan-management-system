import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- ─────────────────────────────────────────────────────────────────────
         STICKY NAVIGATION
    ──────────────────────────────────────────────────────────────────────── -->
    <header class="lp-nav">
      <div class="lp-nav-inner">
        <a routerLink="/" class="lp-brand">
          <img src="hibret-bank-logo.png"
               alt="Hibret Bank"
               class="lp-logo"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <span class="lp-logo-fallback" style="display:none;">
            <span class="lp-logo-icon">🏦</span>
            <span class="lp-logo-text">Hibret Bank</span>
          </span>
        </a>
        <nav class="lp-nav-links">
          <a routerLink="/login"    class="lp-nav-btn lp-nav-login">Login</a>
          <a routerLink="/register" class="lp-nav-btn lp-nav-register">Get Started</a>
        </nav>
      </div>
    </header>

    <main class="lp-main">

      <!-- ───────────────────────────────────────────────────────────────────
           HERO
      ──────────────────────────────────────────────────────────────────────── -->
      <section class="lp-hero">
        <div class="lp-hero-bg">
          <div class="lp-hero-blob lp-blob-1"></div>
          <div class="lp-hero-blob lp-blob-2"></div>
          <div class="lp-hero-blob lp-blob-3"></div>
        </div>

        <div class="lp-hero-inner">

          <!-- ── LEFT: Logo showcase ─────────────────────────────────────── -->
          <div class="lp-hero-logo-col">
            <div class="lp-hero-logo-ring">
              <!-- orbiting dots -->
              <span class="lp-orbit-dot"></span>
              <span class="lp-orbit-dot"></span>
              <span class="lp-orbit-dot"></span>

              <!-- Logo circle -->
              <div class="lp-hero-logo-img-wrap">
                <img src="hibret-bank-logo.png"
                     alt="Hibret Bank Logo"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
                <span class="lp-hero-logo-fallback-icon"
                      style="display:none;">🏦</span>
              </div>
            </div>

            <div class="lp-hero-logo-label">
              <span class="lp-hero-logo-name">Hibret Bank</span>
              <span class="lp-hero-logo-sub">Smart Loan Portal</span>
            </div>

            <div class="lp-hero-trust">
              <div class="lp-trust-item">
                <span class="lp-trust-dot"></span>
                National Bank of Ethiopia Licensed
              </div>
              <div class="lp-trust-item">
                <span class="lp-trust-dot"></span>
                Bank-Grade Security &amp; Encryption
              </div>
              <div class="lp-trust-item">
                <span class="lp-trust-dot"></span>
                ISO 27001 Compliant
              </div>
            </div>
          </div>

          <!-- ── CENTRE: Text ────────────────────────────────────────────── -->
          <div class="lp-hero-text">
            <span class="lp-hero-badge">🏦 Hibret Bank — Smart Loan Portal</span>

            <h1 class="lp-hero-title">
              Smart Loan Management
              <span class="lp-hero-title-accent">Made Simple</span>
            </h1>

            <p class="lp-hero-desc">
              Apply, track, and manage your loans entirely online.
              Hibret Bank's digital loan platform delivers fast approvals,
              transparent processes, and real-time repayment tracking —
              all secured by bank-grade technology.
            </p>

            <div class="lp-hero-actions">
              <a routerLink="/login"    class="lp-btn-primary">
                Login to Your Account →
              </a>
              <a routerLink="/register" class="lp-btn-outline">
                Open New Account
              </a>
            </div>

            <div class="lp-hero-stats">
              <div class="lp-stat">
                <strong>5,000+</strong>
                <span>Loans Processed</span>
              </div>
              <div class="lp-stat-divider"></div>
              <div class="lp-stat">
                <strong>24 hrs</strong>
                <span>Avg. Approval Time</span>
              </div>
              <div class="lp-stat-divider"></div>
              <div class="lp-stat">
                <strong>98%</strong>
                <span>Customer Satisfaction</span>
              </div>
            </div>
          </div>

          <!-- ── RIGHT: Floating cards ──────────────────────────────────── -->
          <div class="lp-hero-visual">
            <div class="lp-card-float lp-card-float--main">
              <div class="lp-card-float-header">
                <img src="hibret-bank-logo.png"
                     alt="Hibret Bank"
                     class="lp-card-logo"
                     onerror="this.style.display='none'" />
                <span class="lp-card-badge active">Active</span>
              </div>
              <p class="lp-card-label">Loan Portfolio</p>
              <p class="lp-card-value">ETB 25,000,000</p>
              <div class="lp-card-progress-bar">
                <div class="lp-card-progress-fill" style="width:68%"></div>
              </div>
              <div class="lp-card-footer">
                <span>68% repaid</span>
                <span class="lp-card-arrow">↗</span>
              </div>
            </div>

            <div class="lp-card-float lp-card-float--pill lp-card-float--pill1">
              <span class="lp-pill-icon">✅</span>
              <div>
                <strong>Loan Approved</strong>
                <p>APP-7A3F9C2B</p>
              </div>
            </div>

            <div class="lp-card-float lp-card-float--pill lp-card-float--pill2">
              <span class="lp-pill-icon">💳</span>
              <div>
                <strong>Repayment Received</strong>
                <p>ETB 5,210.50</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ───────────────────────────────────────────────────────────────────
           FEATURE CARDS
      ──────────────────────────────────────────────────────────────────────── -->
      <section class="lp-features">
        <div class="lp-section-inner">
          <div class="lp-section-head">
            <span class="lp-section-label">Why Choose Hibret Bank?</span>
            <h2 class="lp-section-title">Everything you need, in one place</h2>
            <p class="lp-section-sub">
              A complete digital loan management experience built for
              customers, officers, and managers alike.
            </p>
          </div>

          <div class="lp-feature-grid">
            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrap" style="background:rgba(0,175,169,.1);">
                <span>📝</span>
              </div>
              <h3>Easy Loan Applications</h3>
              <p>
                Submit your application online in minutes. Upload documents,
                choose your loan product, and track progress in real time.
              </p>
            </div>

            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrap" style="background:rgba(49,46,129,.1);">
                <span>⚡</span>
              </div>
              <h3>Fast Loan Processing</h3>
              <p>
                Automated workflows route applications to the right officer
                and manager instantly — decisions within 24 hours.
              </p>
            </div>

            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrap" style="background:rgba(39,174,96,.1);">
                <span>🔒</span>
              </div>
              <h3>Secure Account Management</h3>
              <p>
                Bank-grade JWT authentication, role-based access control,
                and encrypted data keep your information safe.
              </p>
            </div>

            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrap" style="background:rgba(243,156,18,.1);">
                <span>📊</span>
              </div>
              <h3>Repayment Tracking</h3>
              <p>
                View your full repayment schedule, make payments, track
                balances, and download receipts — all from one dashboard.
              </p>
            </div>

            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrap" style="background:rgba(52,152,219,.1);">
                <span>📈</span>
              </div>
              <h3>Transparent Reporting</h3>
              <p>
                Managers and admins access real-time analytics on
                disbursements, collections, and portfolio health.
              </p>
            </div>

            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrap" style="background:rgba(231,76,60,.1);">
                <span>🔔</span>
              </div>
              <h3>Instant Notifications</h3>
              <p>
                Never miss an update. Get real-time notifications for
                approvals, rejections, due dates, and disbursements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────────────────────────────────────────────────────────────────
           HOW IT WORKS
      ──────────────────────────────────────────────────────────────────────── -->
      <section class="lp-how">
        <div class="lp-section-inner">
          <div class="lp-section-head">
            <span class="lp-section-label">Simple Process</span>
            <h2 class="lp-section-title">How It Works</h2>
            <p class="lp-section-sub">
              From application to repayment — every step is digital,
              transparent, and fast.
            </p>
          </div>

          <div class="lp-steps">
            <div class="lp-step" *ngFor="let step of steps; let i = index">
              <div class="lp-step-num">{{ i + 1 }}</div>
              <div class="lp-step-icon">{{ step.icon }}</div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </div>
          </div>

          <div class="lp-how-cta">
            <a routerLink="/register" class="lp-btn-primary">
              Start Your Application Today
            </a>
          </div>
        </div>
      </section>

      <!-- ───────────────────────────────────────────────────────────────────
           LOAN TYPES
      ──────────────────────────────────────────────────────────────────────── -->
      <section class="lp-loans">
        <div class="lp-section-inner">
          <div class="lp-section-head">
            <span class="lp-section-label">Our Products</span>
            <h2 class="lp-section-title">Loan Products We Offer</h2>
          </div>

          <div class="lp-loan-grid">
            <div class="lp-loan-card" *ngFor="let loan of loanTypes">
              <span class="lp-loan-icon">{{ loan.icon }}</span>
              <h3>{{ loan.name }}</h3>
              <p class="lp-loan-rate">From {{ loan.rate }}</p>
              <p class="lp-loan-desc">{{ loan.desc }}</p>
              <a routerLink="/login" class="lp-loan-link">Apply Now →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────────────────────────────────────────────────────────────────
           CTA BANNER
      ──────────────────────────────────────────────────────────────────────── -->
      <section class="lp-cta">
        <div class="lp-cta-inner">
          <h2>Ready to get started?</h2>
          <p>
            Join thousands of Hibret Bank customers who manage their loans
            digitally. Secure, fast, and entirely online.
          </p>
          <div class="lp-cta-btns">
            <a routerLink="/login"    class="lp-btn-primary">Login Now</a>
            <a routerLink="/register" class="lp-btn-white">Create Account</a>
          </div>
        </div>
      </section>

    </main>

    <!-- ─────────────────────────────────────────────────────────────────────
         FOOTER
    ──────────────────────────────────────────────────────────────────────── -->
    <footer class="lp-footer">
      <div class="lp-footer-inner">
        <div class="lp-footer-brand">
          <img src="hibret-bank-logo.png"
               alt="Hibret Bank"
               class="lp-footer-logo"
               onerror="this.style.display='none';this.nextElementSibling.style.display='inline'" />
          <span style="display:none;font-weight:700;color:white;font-size:18px;">🏦 Hibret Bank</span>
          <p class="lp-footer-tagline">
            Smart Loan Management — Powered by Hibret Bank
          </p>
        </div>

        <div class="lp-footer-cols">
          <div class="lp-footer-col">
            <h4>Products</h4>
            <ul>
              <li>Personal Loan</li>
              <li>Home Loan</li>
              <li>Business Loan</li>
              <li>Auto Loan</li>
            </ul>
          </div>
          <div class="lp-footer-col">
            <h4>Portal</h4>
            <ul>
              <li><a routerLink="/login">Login</a></li>
              <li><a routerLink="/register">Register</a></li>
              <li><a routerLink="/forgot-password">Forgot Password</a></li>
            </ul>
          </div>
          <div class="lp-footer-col">
            <h4>Contact</h4>
            <ul>
              <li>Addis Ababa, Ethiopia</li>
              <li>+251 115 570 000</li>
              <li>info&#64;hibretbank.com.et</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="lp-footer-bottom">
        <p>&copy; 2026 Hibret Bank S.C. — Smart Loan Management System. All rights reserved.</p>
        <p class="lp-footer-disclaimer">
          Licensed by the National Bank of Ethiopia · Regulated Financial Institution
        </p>
      </div>
    </footer>
  `
})
export class LandingPageComponent {

  steps = [
    { icon: '📝', title: 'Apply',       desc: 'Fill in your application online. Choose a loan product and submit your documents in minutes.' },
    { icon: '🔍', title: 'Review',      desc: 'A dedicated loan officer reviews your application and forwards it for final approval.' },
    { icon: '✅', title: 'Approval',    desc: 'The bank manager approves or rejects. You receive an instant notification with the decision.' },
    { icon: '💸', title: 'Disbursement', desc: 'Approved funds are transferred to your savings account immediately after approval.' },
    { icon: '💳', title: 'Repayment',   desc: 'Make monthly payments online. Track your schedule, remaining balance, and payment history.' },
  ];

  loanTypes = [
    { icon: '👤', name: 'Personal Loan',  rate: '12.5% p.a.', desc: 'For personal needs — education, healthcare, and more.' },
    { icon: '🏠', name: 'Home Loan',      rate: '8.5% p.a.',  desc: 'Finance your dream home with up to ETB 10,000,000.' },
    { icon: '💼', name: 'Business Loan',  rate: '14.0% p.a.', desc: 'Grow your business with flexible financing options.' },
    { icon: '🚗', name: 'Auto Loan',      rate: '10.0% p.a.', desc: 'Drive your new vehicle home with affordable repayments.' },
  ];
}
