import { Link } from 'react-router-dom';
import './Legal.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: February 22, 2026</p>

        <div className="legal-content">
          <h2>Introduction</h2>
          <p>Slate ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>

          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and password (encrypted)</li>
            <li><strong>Profile Data:</strong> Display name, profile picture (if provided)</li>
            <li><strong>Preferences:</strong> Movie ratings, favorites, watchlists, and viewing preferences</li>
            <li><strong>Usage Data:</strong> App interactions, features used, and session information</li>
            <li><strong>Device Information:</strong> Device type, operating system version, and unique device identifiers</li>
            <li><strong>Log Data:</strong> IP address, access times, and error logs</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our movie recommendation service</li>
            <li>Personalize your experience and deliver tailored content</li>
            <li>Process your account registration and authentication</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Analyze usage patterns and trends to improve our service</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and protect our legal rights</li>
          </ul>

          <h2>Data Storage and Security</h2>
          <p><strong>Where We Store Data:</strong> Your data is stored securely using Firebase services provided by Google LLC. We implement industry-standard security measures including:</p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication protocols</li>
            <li>Regular security assessments</li>
            <li>Access controls and monitoring</li>
          </ul>
          <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security of your data.</p>

          <h2>Third-Party Services</h2>
          <p>We integrate with the following third-party services:</p>
          <ul>
            <li><strong>Firebase (Google LLC):</strong> Authentication, cloud storage, and analytics</li>
            <li><strong>TMDb (The Movie Database):</strong> Movie data, images, and metadata</li>
          </ul>
          <p>These services have their own privacy policies governing their use of your information. We encourage you to review their privacy policies:</p>
          <ul>
            <li>Firebase Privacy Policy: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">firebase.google.com/support/privacy</a></li>
            <li>TMDb Privacy Policy: <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer">themoviedb.org/privacy-policy</a></li>
          </ul>

          <h2>Data Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your data only in the following circumstances:</p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations, court orders, or government requests</li>
            <li>To enforce our Terms of Service or protect our rights, property, and safety</li>
            <li>In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
            <li>With service providers who assist in operating our app (under confidentiality agreements)</li>
          </ul>

          <h2>Data Retention</h2>
          <p>We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account at any time, and we will delete your data within 30 days, except where we are required to retain it for legal purposes.</p>

          <h2>Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-out:</strong> Decline promotional communications (account-related emails still required)</li>
            <li><strong>Withdraw consent:</strong> Revoke previously granted permissions</li>
          </ul>
          <p><strong>How to Exercise Rights:</strong> To exercise these rights, please contact us at <a href="mailto:slateai09@gmail.com">slateai09@gmail.com</a></p>

          <h2>California Privacy Rights</h2>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, use, and disclose, and the right to request deletion of your personal information.</p>

          <h2>International Users</h2>
          <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. By using our service, you consent to such transfer.</p>

          <h2>Children's Privacy</h2>
          <p>Our service is not intended for users under 13 years of age (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.</p>

          <h2>Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of any material changes by updating the "Last Updated" date and, where appropriate, by posting a notice in the app or sending you an email. Your continued use of the app after changes constitutes acceptance of the updated policy.</p>

          <h2>Contact Us</h2>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:slateai09@gmail.com">slateai09@gmail.com</a></p>
          <p>We will respond to your inquiry within 30 days.</p>

          <p className="copyright">© 2026 Slate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;