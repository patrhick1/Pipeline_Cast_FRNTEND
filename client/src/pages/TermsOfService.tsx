import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, CheckCircle, XCircle, Mail } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  const sections = [
    { id: "acceptance", title: "Acceptance of Terms", icon: CheckCircle },
    { id: "services", title: "Services Description", icon: FileText },
    { id: "user-accounts", title: "User Accounts", icon: Shield },
    { id: "acceptable-use", title: "Acceptable Use", icon: Scale },
    { id: "intellectual-property", title: "Intellectual Property", icon: FileText },
    { id: "payment", title: "Payment & Billing", icon: Scale },
    { id: "termination", title: "Termination", icon: XCircle },
    { id: "liability", title: "Limitation of Liability", icon: AlertTriangle },
    { id: "contact", title: "Contact Information", icon: Mail },
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
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Effective Date: January 1, 2024
            </p>
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
              These Terms of Service ("Terms") govern your use of PipelineCast ( "we," "our," or "us") 
              and our podcast outreach and guest booking platform services (the "Services"). By accessing or using our 
              Services, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not 
              access our Services.
            </p>
          </CardContent>
        </Card>

        {/* Acceptance of Terms */}
        <Card className="mb-6" id="acceptance">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              By creating an account or using our Services, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms and our Privacy Policy.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Age Requirement:</strong> You must be at least 18 years old to use our Services. By using our 
                Services, you represent and warrant that you are at least 18 years of age.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Services Description */}
        <Card className="mb-6" id="services">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>2. Services Description</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Pipeline Cast provides a platform that helps individuals and businesses:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Create professional media kits for podcast appearances</li>
              <li>Discover relevant podcast opportunities</li>
              <li>Generate and send personalized pitches to podcast hosts</li>
              <li>Track outreach campaigns and placement success</li>
              <li>Manage email communications with podcast hosts</li>
              <li>Access analytics and reporting tools</li>
            </ul>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Modifications</h3>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue any part of our Services at any time with or 
                without notice. We will not be liable to you or any third party for any modification, suspension, or 
                discontinuation of the Services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card className="mb-6" id="user-accounts">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>3. User Accounts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Account Registration</h3>
              <p className="text-gray-700 mb-3">
                When you create an account with us, you must provide information that is accurate, complete, and current 
                at all times. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring your account information is accurate and up-to-date</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Account Restrictions</h3>
              <p className="text-gray-700">You may not:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use another person's account without permission</li>
                <li>Create multiple accounts for fraudulent purposes</li>
                <li>Share your account credentials with others</li>
                <li>Use automated means to create accounts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card className="mb-6" id="acceptable-use">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-primary" />
              <CardTitle>4. Acceptable Use Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Prohibited Activities</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Send spam, unsolicited messages, or engage in harassment</li>
                <li>Misrepresent your identity or affiliation with any person or entity</li>
                <li>Upload or transmit viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Use the Services to violate any applicable laws or regulations</li>
                <li>Scrape, data mine, or use automated systems to access our Services</li>
                <li>Interfere with or disrupt the Services or servers</li>
                <li>Circumvent any security measures or access restrictions</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 font-medium">Violation Consequences</p>
                  <p className="text-sm text-red-800 mt-1">
                    Violation of this Acceptable Use Policy may result in immediate termination of your account and 
                    legal action if applicable.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="mb-6" id="intellectual-property">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>5. Intellectual Property Rights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Our Intellectual Property</h3>
              <p className="text-gray-700">
                The Services and their original content, features, and functionality are owned by Pipeline Cast
                and are protected by international copyright, trademark, patent, trade secret, and other intellectual
                property laws.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Content</h3>
              <p className="text-gray-700 mb-3">
                You retain ownership of any content you submit to our Services. By submitting content, you grant us a 
                worldwide, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use, reproduce, and display your content as necessary to provide the Services</li>
                <li>Create media kits and pitch materials on your behalf</li>
                <li>Share your information with podcast hosts as part of our Services</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">User Responsibilities</h3>
              <p className="text-gray-700">
                You represent and warrant that you have the right to submit any content you provide and that such 
                content does not infringe on any third-party rights.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Billing */}
        <Card className="mb-6" id="payment">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-primary" />
              <CardTitle>6. Payment & Billing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Subscription Plans</h3>
              <p className="text-gray-700 mb-3">
                Access to certain features of our Services requires a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Pay all applicable fees according to your chosen plan</li>
                <li>Provide accurate and complete billing information</li>
                <li>Authorize us to charge your payment method on a recurring basis</li>
                <li>Be responsible for all taxes associated with your use of the Services</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Free Trial</h3>
              <p className="text-gray-700">
                We may offer a free trial period. At the end of the free trial, your subscription will automatically 
                convert to a paid subscription unless you cancel before the trial period ends.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Refunds</h3>
              <p className="text-gray-700">
                All fees are non-refundable except as required by law or as explicitly stated in these Terms. We do not 
                provide refunds for partial subscription periods.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mb-6" id="termination">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-primary" />
              <CardTitle>7. Termination</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Termination by You</h3>
              <p className="text-gray-700">
                You may terminate your account at any time by contacting us or using the account deletion feature in 
                your settings. Termination does not entitle you to any refunds.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Termination by Us</h3>
              <p className="text-gray-700 mb-3">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, 
                including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Breach of these Terms</li>
                <li>Violation of applicable laws</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Prolonged inactivity</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Effect of Termination</h3>
              <p className="text-gray-700">
                Upon termination, your right to use the Services will immediately cease. We may delete your account and 
                all associated data, though some information may be retained as required by law or for legitimate 
                business purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimers & Limitations */}
        <Card className="mb-6" id="liability">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <CardTitle>8. Disclaimers & Limitation of Liability</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Disclaimer</h3>
              <p className="text-gray-700">
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
                IMPLIED. WE DO NOT GUARANTEE THAT YOU WILL SECURE PODCAST APPEARANCES OR ACHIEVE ANY PARTICULAR RESULTS 
                FROM USING OUR SERVICES.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
              <p className="text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PIPELINE CAST SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Indemnification</h3>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless Pipeline Cast and its affiliates from any claims,
                damages, losses, liabilities, and expenses arising from your use of the Services or violation of these
                Terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* General Provisions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. General Provisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Governing Law</h3>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without 
                regard to its conflict of law provisions.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Changes to Terms</h3>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the 
                new Terms on this page and updating the "Last updated" date. Your continued use of the Services after 
                any changes constitutes acceptance of the new Terms.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Severability</h3>
              <p className="text-gray-700">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited 
                or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force 
                and effect.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Entire Agreement</h3>
              <p className="text-gray-700">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Pipeline
                Cast regarding the use of our Services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6" id="contact">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <CardTitle>10. Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@pipelinecast.co
              </p>
              <p className="text-gray-700">
                <strong>Support:</strong> support@pipelinecast.co
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong> www.pipelinecast.co
              </p>
              <p className="text-gray-700">
                <strong>Company:</strong> Pipeline Cast (Remote)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Pipeline Cast. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/terms">
              <a className="hover:text-primary">Terms of Service</a>
            </Link>
            <span>•</span>
            <Link href="/privacy">
              <a className="hover:text-primary">Privacy Policy</a>
            </Link>
            <span>•</span>
            <Link href="/contact">
              <a className="hover:text-primary">Contact Us</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}