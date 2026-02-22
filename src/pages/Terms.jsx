import { Link } from 'react-router-dom';
import './Legal.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: February 22, 2026</p>

        <div className="legal-content">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing, downloading, or using Slate (the "App"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the App. We reserve the right to update these Terms at any time, and your continued use constitutes acceptance of any changes.</p>

          <h2>2. Description of Service</h2>
          <p>Slate is a mobile application that provides personalized movie recommendations and information. The service includes access to movie data, ratings, reviews, and personalized features based on your preferences and interactions.</p>

          <h2>3. User Accounts</h2>
          <p>To use certain features of the App, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security and confidentiality of your password</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
          <p>You may not use another person's account without permission or create multiple accounts.</p>

          <h2>4. Use License and Restrictions</h2>
          <p>We grant you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes. You agree NOT to:</p>
          <ul>
            <li>Copy, modify, or distribute the App or its content</li>
            <li>Reverse engineer, decompile, or disassemble the App</li>
            <li>Remove or modify any copyright or proprietary notices</li>
            <li>Use the App for any illegal or unauthorized purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the App's functionality</li>
            <li>Use automated systems (bots, scrapers) without authorization</li>
            <li>Impersonate any person or entity</li>
          </ul>

          <h2>5. Content and Intellectual Property</h2>
          <p>Movie data, images, posters, titles, and metadata are provided by TMDb (The Movie Database). Slate is not affiliated with, endorsed by, or sponsored by TMDb. All movie-related content is the property of their respective copyright holders.</p>
          <p>The Slate app, including its design, features, functionality, and code, is owned by Slate and is protected by copyright, trademark, and other intellectual property laws.</p>
          <p>User-generated content (ratings, reviews, lists) remains your property, but you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute such content as part of the service.</p>

          <h2>6. User Conduct</h2>
          <p>You agree to use the App in a manner consistent with all applicable laws and regulations. You will not:</p>
          <ul>
            <li>Post or transmit harmful, offensive, or illegal content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate the intellectual property rights of others</li>
            <li>Spam or send unsolicited communications</li>
            <li>Engage in fraudulent activities</li>
          </ul>

          <h2>7. Privacy and Data Protection</h2>
          <p>Your use of Slate is governed by our <Link to="/privacy">Privacy Policy</Link>, which explains how we collect, use, and protect your information. By using the App, you consent to our data practices as described in the Privacy Policy. Please review it carefully.</p>

          <h2>8. Termination</h2>
          <p>We reserve the right to terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason, including:</p>
          <ul>
            <li>Violation of these Terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Prolonged inactivity</li>
            <li>At our sole discretion for operational or business reasons</li>
          </ul>
          <p>Upon termination, your right to use the App will immediately cease. You may also delete your account at any time from within the App settings.</p>

          <h2>9. Modifications to Service</h2>
          <p>We reserve the right to modify, suspend, or discontinue the App or any part of it at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation of the service.</p>

          <h2>10. Disclaimers and Warranties</h2>
          <p><strong>THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</strong></p>
          <ul>
            <li>Warranties of merchantability or fitness for a particular purpose</li>
            <li>Accuracy, reliability, or availability of the service</li>
            <li>Uninterrupted or error-free operation</li>
            <li>Security or freedom from viruses or harmful components</li>
          </ul>
          <p>We do not guarantee the accuracy, completeness, or usefulness of any movie information provided through the App.</p>

          <h2>11. Limitation of Liability</h2>
          <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SLATE AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING:</strong></p>
          <ul>
            <li>Loss of profits, data, or use</li>
            <li>Business interruption</li>
            <li>Personal injury or property damage</li>
            <li>Any damages arising from use or inability to use the App</li>
          </ul>
          <p>In jurisdictions that do not allow limitation of liability, our liability is limited to the maximum extent permitted by law.</p>

          <h2>12. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless Slate, its affiliates, and their respective officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including legal fees) arising from:</p>
          <ul>
            <li>Your use or misuse of the App</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your user-generated content</li>
          </ul>

          <h2>13. Governing Law and Disputes</h2>
          <p>These Terms are governed by and construed in accordance with the laws of the jurisdiction in which Slate operates, without regard to conflict of law principles. Any disputes arising from these Terms or the App will be resolved through binding arbitration, except where prohibited by law.</p>

          <h2>14. Severability</h2>
          <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.</p>

          <h2>15. Entire Agreement</h2>
          <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Slate regarding the App and supersede any prior agreements.</p>

          <h2>16. Contact Information</h2>
          <p>For questions, concerns, or support regarding these Terms of Service, please contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:slateai09@gmail.com">slateai09@gmail.com</a></p>
          <p>We will respond to your inquiry within 30 days.</p>

          <h2>Acknowledgment</h2>
          <p><strong>BY USING SLATE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM.</strong></p>

          <p className="copyright">© 2026 Slate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;