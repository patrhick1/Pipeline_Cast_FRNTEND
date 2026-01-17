import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Mail, Database, Globe, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  const sections = [
    { id: "information-we-collect", title: "Information We Collect", icon: Database },
    { id: "how-we-use", title: "How We Use Your Information", icon: Eye },
    { id: "data-sharing", title: "Data Sharing & Disclosure", icon: Globe },
    { id: "data-security", title: "Data Security", icon: Lock },
    { id: "your-rights", title: "Your Rights & Choices", icon: UserCheck },
    { id: "contact", title: "Contact Us", icon: Mail },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => scrollToSection(section.id)}
                >
                  <section.icon className="w-4 h-4 mr-2" />
                  {section.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Introduction */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">
              Welcome to PipelineCast ( "we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our podcast outreach and guest booking platform.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6" id="information-we-collect">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Information We Collect</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Personal Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Account information (name, email address, password)</li>
                <li>Professional information (bio, expertise, achievements)</li>
                <li>Contact details for podcast outreach</li>
                <li>Social media profiles and website URLs</li>
                <li>Media kit content including headshots and company logos</li>
                <li>Podcast appearance history and speaking clips</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Email engagement metrics (opens, clicks)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Email service provider data (via Nylas integration)</li>
                <li>Podcast directory information</li>
                <li>Social media profile data (when connected)</li>
                <li>Analytics and tracking services</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6" id="how-we-use">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <CardTitle>How We Use Your Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">We use the information we collect to:</p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Provide and Improve Our Services</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Create and manage your account</li>
                <li>Generate professional media kits and pitch templates</li>
                <li>Match you with relevant podcast opportunities</li>
                <li>Send podcast pitches on your behalf</li>
                <li>Track and analyze outreach campaign performance</li>
                <li>Provide customer support and respond to inquiries</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Communications</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Send service-related notifications and updates</li>
                <li>Provide booking confirmations and reminders</li>
                <li>Share podcast opportunities and recommendations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Legal and Security</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Comply with legal obligations</li>
                <li>Protect against fraud and abuse</li>
                <li>Enforce our terms of service</li>
                <li>Protect our rights and the rights of our users</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing & Disclosure */}
        <Card className="mb-6" id="data-sharing">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle>Data Sharing & Disclosure</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">We may share your information in the following circumstances:</p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">With Podcast Hosts</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Your media kit information when you authorize a pitch</li>
                <li>Contact information for booking purposes</li>
                <li>Professional background and expertise relevant to the show</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Email service providers (Nylas, Instantly)</li>
                <li>Cloud storage and hosting services</li>
                <li>Analytics and monitoring tools</li>
                <li>Payment processors (for premium features)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Legal Requirements</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To comply with laws, regulations, or legal processes</li>
                <li>To protect the safety of our users and the public</li>
                <li>To protect against legal liability</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Important Note</p>
                  <p className="text-sm text-blue-800 mt-1">
                    We never sell, rent, or trade your personal information to third parties for their marketing purposes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6" id="data-security">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Data Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure password hashing using industry standards</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure cloud infrastructure with regular backups</li>
              <li>Employee training on data protection practices</li>
            </ul>

            <p className="text-gray-700 mt-4">
              While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security but we are committed to maintaining the highest standards of data protection.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights & Choices */}
        <Card className="mb-6" id="your-rights">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <CardTitle>Your Rights & Choices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">You have the following rights regarding your personal information:</p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Access and Portability</h3>
              <p className="text-gray-700">
                You can access, update, or download your personal information at any time through your account settings.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Correction</h3>
              <p className="text-gray-700">
                You can correct or update inaccurate or incomplete personal information through your profile or by contacting us.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Deletion</h3>
              <p className="text-gray-700">
                You can request deletion of your account and personal information, subject to certain legal exceptions.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Communication Preferences</h3>
              <p className="text-gray-700">
                You can opt-out of marketing communications at any time through your account settings or by clicking the unsubscribe link in our emails.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Cookie Preferences</h3>
              <p className="text-gray-700">
                You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect functionality.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain business records for analysis and auditing</li>
            </ul>
            <p className="text-gray-700 mt-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* International Data Transfers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from your country. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
            </p>
          </CardContent>
        </Card>

        {/* Changes to This Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. For material changes, we will provide additional notice through email or in-app notifications.
            </p>
          </CardContent>
        </Card>

        {/* Contact Us */}
        <Card className="mb-6" id="contact">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <CardTitle>Contact Us</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@podcastguestlaunch.com
              </p>
              <p className="text-gray-700">
                <strong>Support:</strong> support@podcastguestlaunch.com
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong> www.podcastguestlaunch.com
              </p>
            </div>

            <p className="text-gray-700 mt-4">
              We aim to respond to all privacy-related inquiries within 48 hours.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Podcast Guest Launch. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/terms">
              <a className="hover:text-primary">Terms of Service</a>
            </Link>
            <span>•</span>
            <Link href="/privacy">
              <a className="hover:text-primary">Privacy Policy</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}