
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <p>Welcome to Echo Canvas! This is a placeholder Privacy Policy. In a real application, this page would detail how user data is collected, used, and protected.</p>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">1. Information We Collect</h2>
            <p>We would typically collect information such as:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-1">
              <li>Account information (email, password) for authentication.</li>
              <li>User preferences and interactions (liked songs, playlist data).</li>
              <li>Usage data (how you interact with the app).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">2. How We Use Your Information</h2>
            <p>Your information would be used to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-1">
              <li>Provide and improve Echo Canvas services.</li>
              <li>Personalize your experience (e.g., AI music suggestions).</li>
              <li>Communicate with you about updates or support.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">3. Data Sharing</h2>
            <p>We would specify if and how data is shared with third parties (e.g., Firebase for authentication, AI service providers under strict confidentiality).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">4. Your Rights</h2>
            <p>You would have rights regarding your data, such as access, correction, and deletion. Details on how to exercise these rights would be provided.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at [placeholder email address].</p>
          </section>

          <p className="mt-8 text-sm text-muted-foreground">This policy is effective as of [Date]. We may update it periodically.</p>
        </CardContent>
      </Card>
    </div>
  );
}
