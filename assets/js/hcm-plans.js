/* GM HCM plan catalogue. Edit prices and limits here; the pricing page reads this file.
   When the paid platform launches, the Super Admin dashboard will manage these values on the server instead. */
window.GM_HCM_PLANS = {
  currency: 'Rs.',
  annualMonthsBilled: 10, // annual billing = 10 months price (2 months free). Change here to adjust the yearly price.
  plans: [
    { id: 'demo', name: 'Free Demo', monthly: 0, capacity: 'Sample data only', blurb: 'Explore the product with fictional data. Nothing is saved or processed.', features: ['Interactive dashboard', 'Sample employees, attendance and leave', 'Payslip preview with sample PDF', 'No real employee records', 'No real payroll processing'], cta: 'Open the demo', href: 'demo/' },
    { id: 'starter', name: 'Starter', monthly: 1499, capacity: 'Up to 25 employees', blurb: 'For small teams that need clean records, attendance and leave.', features: ['Employee management', 'Attendance (check-in / check-out)', 'Leave management and balances', 'Basic reports', 'Email support'], cta: 'Request early access' },
    { id: 'business', name: 'Business', monthly: 3999, capacity: 'Up to 100 employees', featured: true, blurb: 'The complete HR toolkit for growing companies.', features: ['Everything in Starter', 'Payroll, payslips and PDF export', 'Recruitment and candidate tracking', 'Performance management (KPIs, reviews, goals)', 'Advanced reports with Excel and PDF export'], cta: 'Request early access' },
    { id: 'enterprise', name: 'Enterprise', monthly: null, capacity: 'Custom employee capacity', blurb: 'For larger organisations with several departments and locations.', features: ['Everything in Business', 'Multiple departments and locations', 'Advanced permissions', 'Advanced analytics and custom configuration', 'Priority support'], cta: 'Request a quotation' }
  ]
};
