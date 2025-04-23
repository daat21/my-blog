import EmailIcon from '@/components/contact/EmailIcon'
import GithubIcon from '@/components/contact/GithubIcon'
import LinkedinIcon from '@/components/contact/LinkedinIcon'
import ContactForm from '@/components/contact/ContactForm'

export default function ContactPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="border-0 text-2xl font-semibold md:mt-10 md:text-3xl">
        Contact Me
      </h2>
      <div className="flex flex-row gap-4 p-4">
        <EmailIcon />

        <GithubIcon />
        <LinkedinIcon />
      </div>
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 p-4">
        <p>
          Reach out to me over email or fill up this contact form. I will get
          back to you ASAP!
        </p>
        <ContactForm />
      </div>
    </div>
  )
}
