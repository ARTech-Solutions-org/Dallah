import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateRegistration, useGetRegistrationStatus } from '@workspace/api-client-react';
import type { RegistrationInput } from '@workspace/api-client-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Building2,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Handshake,
  Mail,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import bannerImage from './assets/dallah-banner.jpg';
import shieldLogo from '@assets/Untitled_design_(19)_1788357176875.png';
import dallahLogo from '@assets/Untitled_design_(24)_1788357638105.png';
import referenceHero from '@assets/image_1788357913186.png';
import poweredByLogo from './assets/powered-by.png';

const queryClient = new QueryClient();

const phoneSchema = z.string().trim().min(1, 'Phone number is required').refine((value) => {
  const normalized = value.replace(/[\s().-]/g, '');
  const isSaudiLocal = /^05\d{8}$/.test(normalized);
  const isSaudiInternational = /^\+9665\d{8}$/.test(normalized);
  const isInternational = /^\+[1-9]\d{6,14}$/.test(normalized);
  return isSaudiLocal || isSaudiInternational || isInternational;
}, 'Enter a valid Saudi or international phone number');

const registrationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: phoneSchema,
  scfhsNumber: z.string().trim().min(1, 'SCFHS number is required'),
  nationalId: z.string().trim().min(1, 'National ID is required').regex(/^\d+$/, 'National ID must contain numbers only'),
  speciality: z.string().trim().min(1, 'Speciality is required'),
  hospital: z.string().trim().min(1, 'Hospital is required'),
});

type FormValues = z.infer<typeof registrationSchema>;

const defaultValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  scfhsNumber: '',
  nationalId: '',
  speciality: '',
  hospital: '',
};

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { error?: string; message?: string; data?: { error?: string }; response?: { data?: { error?: string } } };
    return candidate.data?.error || candidate.response?.data?.error || candidate.error || candidate.message || 'We could not complete your registration. Please try again.';
  }
  return 'We could not complete your registration. Please try again.';
}

function SectionKicker({ children }: { children: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-accent" aria-hidden="true" />
      {children}
    </p>
  );
}

function InputField({
  name,
  label,
  placeholder,
  type = 'text',
  hint,
  inputMode,
  icon,
}: {
  name: keyof FormValues;
  label: string;
  placeholder: string;
  type?: string;
  hint?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  icon: LucideIcon;
}) {
  const Icon = icon;

  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-[0.7rem] font-bold text-foreground sm:text-xs">
            {label}<span className="ml-0.5 text-[#b34b42]" aria-hidden="true">*</span>
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#579497]" aria-hidden="true" />
              <input
                {...field}
                type={type}
                inputMode={inputMode}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                data-testid={`input-${name}`}
                className="h-11 w-full rounded-md border border-[#c9c9c2] bg-[#fffdfa] pl-9 pr-3 text-sm text-foreground shadow-[0_3px_8px_rgba(35,68,67,0.10)] outline-none transition duration-200 placeholder:text-[#8b918e] focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </FormControl>
          {hint && <p className="text-[0.66rem] leading-4 text-muted-foreground">{hint}</p>}
          <FormMessage data-testid={`error-${name}`} />
        </FormItem>
      )}
    />
  );
}

function RegistrationForm({ onSuccess, alreadyRegistered = false }: { onSuccess: (name: string) => void; alreadyRegistered?: boolean }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues,
    mode: 'onBlur',
  });
  const createRegistration = useCreateRegistration();
  const [submissionError, setSubmissionError] = useState('');

  if (alreadyRegistered) {
    return (
      <div role="status" className="border-l-2 border-primary bg-primary/5 px-5 py-4 text-sm leading-6 text-foreground">
        This browser has already been used to register for the conference.
      </div>
    );
  }

  const submitRegistration = (values: FormValues) => {
    setSubmissionError('');
    createRegistration.mutate(
      { data: values as RegistrationInput },
      {
        onSuccess: (confirmation) => onSuccess(confirmation.name),
        onError: (error) => setSubmissionError(getErrorMessage(error)),
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitRegistration)} className="space-y-6" noValidate>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <InputField name="firstName" label="First name" placeholder="First name" icon={UserRound} />
          <InputField name="lastName" label="Last name" placeholder="Last name" icon={UserRound} />
          <InputField name="email" label="Email" placeholder="name@hospital.com" type="email" icon={Mail} />
          <InputField
            name="phone"
            label="Phone number"
            placeholder="+966 5X XXX XXXX"
            type="tel"
            hint="Saudi numbers may be entered as 05X XXX XXXX or +966 5X XXX XXXX."
            icon={Phone}
          />
          <InputField name="scfhsNumber" label="SCFHS number" placeholder="Professional registration number" icon={ClipboardCheck} />
          <InputField name="nationalId" label="National ID / Iqama number" placeholder="Numbers only" inputMode="numeric" icon={ShieldCheck} />
          <InputField name="speciality" label="Speciality" placeholder="e.g. Endocrinology" icon={BadgeCheck} />
          <InputField name="hospital" label="Hospital" placeholder="Hospital / institution" icon={Building2} />
        </div>

        {submissionError && (
          <div
            role="alert"
            data-testid="error-submission"
            className="flex items-start gap-3 rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive sm:col-span-2"
          >
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
            <span>{submissionError}</span>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-[#d6d4cb] pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-[0.68rem] leading-5 text-muted-foreground">
            Your details are collected only to coordinate attendance at this conference.
          </p>
          <button
            type="submit"
            disabled={createRegistration.isPending}
            data-testid="button-submit-registration"
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1c9292] px-7 text-sm font-bold text-white shadow-[0_7px_12px_rgba(20,103,106,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#157d80] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0 sm:w-44"
          >
            {createRegistration.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground" aria-hidden="true" />
                Submitting registration
              </>
            ) : (
              <>
                Submit
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </Form>
  );
}

function LegacyHome() {
  const [confirmationName, setConfirmationName] = useState<string | null>(null);

  if (confirmationName) {
    return (
      <main className="page-grain flex min-h-[100dvh] items-center justify-center bg-background px-6">
        <div data-testid="text-confirmation" className="max-w-3xl space-y-5 text-center font-display text-xl font-semibold leading-relaxed tracking-tight text-foreground sm:text-2xl">
          <p>Dear {confirmationName},</p>
          <p>Thank you for registering! We&apos;re truly excited to have you with us and can&apos;t wait to welcome you at the event.</p>
          <p>Your participation means a lot to us, and we look forward to sharing an inspiring, engaging, and memorable experience together.</p>
          <p>See you soon!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-grain min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute -right-40 top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl animate-breathe" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-48 top-[38rem] h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
        <header className="flex items-center justify-between pb-7 sm:pb-9">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
              <Check className="h-4 w-4" strokeWidth={3} />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold tracking-tight text-foreground">Dallah Hospitals</p>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Professional events</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            A considered welcome for every attendee
          </div>
        </header>

        <section className="animate-rise-in overflow-hidden rounded-[1.7rem] border border-primary/10 bg-card shadow-[0_24px_70px_rgba(20,75,76,0.12)]">
          <img
            src={bannerImage}
            alt="Diabetes and Obesity Conference by Dallah Hospital Al Nakheel, Riyadh, September 18th 2026"
            data-testid="img-conference-banner"
            className="block h-auto w-full"
          />
          <div className="grid gap-6 border-t border-primary/10 bg-primary px-6 py-5 text-primary-foreground sm:grid-cols-3 sm:px-10">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary-foreground/65">When</p>
                <p className="mt-0.5 text-sm font-semibold">Friday, September 18th, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary-foreground/65">Where</p>
                <p className="mt-0.5 text-sm font-semibold">Crowne Plaza RDC, Riyadh</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary-foreground/65">For</p>
                <p className="mt-0.5 text-sm font-semibold">Healthcare professionals</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl py-16 sm:py-20">
          <div className="mb-10 max-w-2xl animate-rise-in-delay sm:mb-12">
            <SectionKicker>Attendee registration</SectionKicker>
            <h1 data-testid="text-registration-heading" className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl">
              Your place in the conversation starts here.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Tell us a little about yourself and your practice. We look forward to welcoming you to an afternoon of meaningful clinical exchange.
            </p>
          </div>

          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-16">
            <div className="rounded-[1.5rem] border border-border/80 bg-card p-6 shadow-[0_18px_45px_rgba(20,75,76,0.08)] sm:p-9">
              <div className="mb-8 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-primary">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">About you</h2>
                  <p className="mt-1 text-sm text-muted-foreground">All fields are required for registration.</p>
                </div>
              </div>
              <RegistrationForm onSuccess={setConfirmationName} />
            </div>

            <aside className="space-y-6 lg:pt-5">
              <div className="border-l-2 border-accent pl-5">
                <SectionKicker>A thoughtful start</SectionKicker>
                <p className="text-sm leading-6 text-muted-foreground">
                  This gathering brings colleagues together around practical, current approaches to diabetes and obesity care.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="font-display text-sm font-bold text-foreground">Your information matters</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  We use your details to prepare for your attendance and keep the welcome personal.
                </p>
              </div>
              <div className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Registration details are handled by the Dallah Hospital Al Nakheel conference team.</span>
              </div>
            </aside>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-border/70 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Diabetes &amp; Obesity Conference · Dallah Hospital Al Nakheel</span>
          <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Riyadh · Saudi Arabia</span>
        </footer>
      </div>
    </main>
  );
}

function Home() {
  const [confirmationName, setConfirmationName] = useState<string | null>(null);
  const { data: registrationStatus } = useGetRegistrationStatus();

  if (confirmationName) {
    return (
      <main className="conference-page relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-8">
        <div className="conference-orb conference-orb-top" aria-hidden="true" />
        <div className="conference-orb conference-orb-bottom" aria-hidden="true" />
        <section className="confirmation-card relative z-10 w-full max-w-[470px] rounded-[0.9rem] border border-[#d8d1c3] bg-[#fcf8ef] px-6 py-8 shadow-[0_20px_55px_rgba(28,68,67,0.16)] sm:px-9 sm:py-10">
          <div className="confirmation-art relative mx-auto mb-7 flex h-36 w-36 items-center justify-center" aria-hidden="true">
            <Network className="absolute h-32 w-32 text-[#77b6ae] opacity-80" strokeWidth={1} />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#fcf8ef]">
              <Handshake className="h-16 w-16 text-[#087c80]" strokeWidth={1.35} />
            </div>
          </div>
          <div data-testid="text-confirmation" className="space-y-5 text-left text-[0.95rem] leading-7 text-[#1c4c4d]">
            <p>Dear {confirmationName},</p>
            <p>Thank you for registering! We&apos;re truly excited to have you with us and can&apos;t wait to welcome you at the event.</p>
            <p>Your participation means a lot to us, and we look forward to sharing an inspiring, engaging, and memorable experience together.</p>
            <p>See you soon!</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="conference-page relative min-h-[100dvh] overflow-hidden">
      <div className="conference-orb conference-orb-top" aria-hidden="true" />
      <div className="conference-orb conference-orb-left" aria-hidden="true" />
      <div className="conference-dots conference-dots-left" aria-hidden="true" />
      <div className="conference-dots conference-dots-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1080px] px-4 pt-5 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10">
        <header className="mb-4 flex items-center justify-between px-1 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <img src={shieldLogo} alt="Dallah Hospitals emblem" className="h-9 w-auto drop-shadow-[0_3px_5px_rgba(28,68,67,0.15)] brightness-0 invert" />
            <img src={dallahLogo} alt="Dallah Hospitals" className="h-7 w-auto rounded-md bg-white/10 px-2 py-1 shadow-[0_4px_10px_rgba(28,68,67,0.12)] brightness-0 invert" />
          </div>
          <div className="text-right text-[0.63rem] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-[0.68rem]">
            <p>Conference registration</p>
            <p className="mt-1 text-white">Riyadh · 18.09.26</p>
          </div>
        </header>
      </div>

      <section className="hero-banner relative z-10 w-full overflow-hidden border-y border-[#0c7c80]/20 bg-[#3cc0cf] shadow-[0_20px_50px_rgba(28,68,67,0.2)]">
        <img
          src={referenceHero}
          alt="Diabetes and Obesity Conference by Dallah Hospital Al Nakheel, Riyadh, September 18th 2026"
          data-testid="img-conference-banner"
          className="mx-auto block h-auto w-full max-w-[1920px] object-cover"
        />
      </section>

      <div className="relative z-10 mx-auto max-w-[1080px] px-4 pb-5 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10">
        <section className="registration-card relative z-10 mx-auto mt-5 max-w-[900px] rounded-[0.9rem] border-2 border-[#087c80] bg-[#fcf8ef] px-5 py-6 shadow-[0_22px_45px_rgba(28,68,67,0.2)] sm:mt-8 sm:px-9 sm:py-8 lg:mt-10 lg:px-10 lg:py-9">
          <div className="mb-7 flex items-start justify-between gap-5 border-b border-[#d9d5ca] pb-5">
            <div>
              <p className="mb-1.5 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#087c80]">Attendee details</p>
              <h1 data-testid="text-registration-heading" className="font-display text-2xl font-extrabold tracking-[-0.035em] text-[#183e40] sm:text-3xl">
                Registration Form
              </h1>
              <p className="mt-2 text-xs text-[#71807d] sm:text-sm">All fields are required for registration.</p>
            </div>
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#d8ece7] text-[#087c80] sm:flex">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <RegistrationForm
            onSuccess={setConfirmationName}
            alreadyRegistered={registrationStatus?.registered === true}
          />
        </section>

        <footer className="mt-8 flex flex-col gap-2 px-1 text-[0.68rem] text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>Diabetes &amp; Obesity Conference · Dallah Hospital Al Nakheel</span>
          <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-white/90" aria-hidden="true" /> Riyadh · Saudi Arabia</span>
        </footer>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 pb-4 text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/70">Powered by</span>
          <img src={poweredByLogo} alt="Powered by" className="h-10 w-auto object-contain opacity-90 drop-shadow-sm brightness-0 invert" />
        </div>
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;