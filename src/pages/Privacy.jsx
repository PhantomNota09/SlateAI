import { Link } from 'react-router-dom';
import './Legal.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: December 26, 2025</p>

        <div className="legal-content">
          <p>Slate ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.</p>

          <h2>1. Information We Collect</h2>
          <p><strong>A. Information You Provide:</strong></p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
            <li><strong>Preference Information:</strong> Favorite genres, languages, quality standards, session length, themes</li>
            <li><strong>Usage Information:</strong> Movie ratings, watched movies, dismissed movies, recommendation feedback</li>
          </ul>
          <p><strong>B. Automatically Collected Information:</strong></p>
          <ul>
            <li><strong>Device Information:</strong> Device type, OS version, unique identifiers</li>
            <li><strong>Usage Data:</strong> App features used, time spent, interaction patterns</li>
            <li><strong>Location:</strong> We do NOT collect precise location data</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p><strong>Primary Purposes:</strong></p>
          <ul>
            <li>Provide personalized movie recommendations</li>
            <li>Create and manage your account</li>
            <li>Learn your taste profile and improve accuracy</li>
            <li>Verify identity and secure your account</li>
          </ul>
          <p><strong>We Do NOT:</strong></p>
          <ul>
            <li>Sell your personal information to third parties</li>
            <li>Use your data for advertising purposes</li>
            <li>Share your viewing history publicly</li>
            <li>Track you across other apps or websites</li>
          </ul>

          <h2>3. How We Share Your Information</h2>
          <p>We do not sell or rent your personal information. We share information only in limited circumstances:</p>
          <p><strong>Service Providers:</strong></p>
          <ul>
            <li><strong>Firebase (Google LLC):</strong> Authentication, database storage, analytics</li>
            <li><strong>The Movie Database (TMDb):</strong> Movie data, posters, metadata</li>
            <li><strong>Apple Inc.:</strong> App distribution via App Store</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <p><strong>Where We Store Data:</strong> Your data is stored on secure Firebase servers operated by Google Cloud Platform, located in the United States.</p>
          <p><strong>Security Measures:</strong></p>
          <ul>
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest (Firebase encryption)</li>
            <li>Password hashing</li>
            <li>Secure authentication tokens</li>
            <li>Regular security audits</li>
          </ul>
          <p><strong>Data Retention:</strong></p>
          <ul>
            <li>Account data: Retained while your account is active</li>
            <li>Deleted accounts: Data removed within 30 days</li>
          </ul>

          <h2>5. Your Privacy Rights</h2>
          <p>You have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Objection:</strong> Object to certain data processing</li>
          </ul>
          <p><strong>How to Exercise Rights:</strong> Email us at <a href="mailto:phantomnota09@gmail.com">phantomnota09@gmail.com</a></p>

          <h2>6. Your Choices</h2>
          <ul>
            <li><strong>Account Information:</strong> Update name, email, password in app settings</li>
            <li><strong>Data Collection:</strong> Disable analytics (may limit personalization)</li>
            <li><strong>Account Deletion:</strong> Settings → Account → Delete Account</li>
          </ul>

          <h2>7. Children's Privacy</h2>
          <p><strong>Age Requirement:</strong> Slate is not intended for children under 13 years of age.</p>
          <p><strong>Parental Consent:</strong> Users aged 13-17 must have parental or guardian consent.</p>
          <p>If you believe your child has provided us with personal information, contact us at <a href="mailto:phantomnota09@gmail.com">phantomnota09@gmail.com</a></p>

          <h2>8. International Users</h2>
          <p>Slate is operated in the United States. If you use the Service from outside the U.S., your information will be transferred to, stored in, and processed in the United States.</p>

          <h2>9. California Privacy Rights (CCPA)</h2>
          <p>California residents have specific rights:</p>
          <ul>
            <li>Right to know what data we collect</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of sales (we don't sell data)</li>
            <li>Right to non-discrimination</li>
          </ul>

          <h2>10. Third-Party Links</h2>
          <p>The Service may contain links to third-party websites (e.g., TMDb, streaming platforms). We are not responsible for their privacy practices.</p>

          <h2>11. Analytics and Tracking</h2>
          <p>We use Firebase Analytics to understand app usage. You can disable analytics in app settings.</p>
          <p><strong>No Advertising:</strong> We do not use your data for targeted advertising.</p>

          <h2>12. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. Significant changes will be notified via email or in-app.</p>

          <h2>13. Contact Us</h2>
          <p><strong>Privacy Questions:</strong> <a href="mailto:phantomnota09@gmail.com">phantomnota09@gmail.com</a></p>

          <h2>14. Consent</h2>
          <p>By using Slate, you consent to this Privacy Policy and agree to its terms.</p>

          <p className="copyright">© 2025 Slate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
