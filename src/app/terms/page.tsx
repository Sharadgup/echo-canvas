
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <p>Welcome to Echo Canvas! These are placeholder Terms of Service. In a real application, this page would outline the rules and regulations for the use of Echo Canvas's Website and services.</p>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">1. Acceptance of Terms</h2>
            <p>By accessing and using Echo Canvas, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">2. User Accounts</h2>
            <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">3. Use of Service</h2>
            <p>You agree to use Echo Canvas only for lawful purposes. You are prohibited from posting on or transmitting through Echo Canvas any material that is infringing, threatening, defamatory, obscene, or otherwise unlawful.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">4. Intellectual Property</h2>
            <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Echo Canvas and its licensors. Our trademarks may not be used in connection with any product or service without the prior written consent of Echo Canvas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">5. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">6. Disclaimer</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Use of the Service is at your own risk. To the maximum extent permitted by applicable law, the Service is provided without warranties of any kind.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">7. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at [placeholder email address].</p>
          </section>

           <p className="mt-8 text-sm text-muted-foreground">These terms are effective as of [Date].</p>
        </CardContent>
      </Card>
    </div>
  );
}
