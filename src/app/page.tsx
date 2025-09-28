"use client";

import React from "react";
import { Star, Check, Mail, IdCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/user/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Overlay gradient for hero background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent"></div>

      <Navbar />
      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="">Connect, Explore, and Experience</span> with{" "}
                <span className="text-brand-quaternary">Gwalk</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Create your own events and join the events that interest you.
                Discover new experiences, meet like-minded people, and build
                lasting connections in your community.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  className="h-16 bg-brand-quaternary text-brand-on rounded-md px-8 has-[>svg]:px-8"
                  asChild
                >
                  <Link href="/sign-in">
                    <span className="text-lg font-medium hover:brightness-90">
                      Get Started
                    </span>
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  size="lg"
                  className="bg-brand-primary hover:brightness-90"
                  asChild
                >
                  <Link href="#service">
                    <span className="text-lg font-medium">Service</span>
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-brand-tertiary hover:brightness-90"
                  asChild
                >
                  <Link href="#about">
                    <span className="text-lg font-medium">About Us</span>
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-brand-secondary hover:brightness-90"
                  asChild
                >
                  <Link  href="#contact">
                    <span className="text-lg font-medium">Contact</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Image Area */}
            <div className="relative">
              <div className="overflow-hidden border-border/60">
                <div className="aspect-[4/3] bg-card/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <Image
                      src="/gwalk-icon.svg"
                      alt="Gwalk App"
                      width={300}
                      height={225}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 z-20">
                <div className="w-16 h-16 bg-brand-quaternary rounded-2xl flex items-center justify-center text-brand-on shadow-lg animate-bounce">
                  <Star className="h-8 w-8" />
                </div>
              </div>

              <div className="absolute top-1/2 -right-6 z-20">
                <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-brand-on shadow-lg animate-pulse">
                  <Check className="h-7 w-7" />
                </div>
              </div>

              <div className="absolute -bottom-6 left-8 z-20">
                <div className="w-12 h-12 bg-brand-tertiary rounded-2xl flex items-center justify-center text-brand-on shadow-lg animate-bounce [animation-delay:1s]">
                  <Mail className="h-6 w-6" />
                </div>
              </div>

              {/* Background Decorative Elements */}
              <div className="absolute top-10 left-10 w-20 h-20 bg-brand-secondary-soft rounded-full animate-pulse"></div>
              <div className="absolute bottom-16 right-16 w-16 h-16 bg-brand-quaternary-soft rounded-full animate-pulse [animation-delay:2s]"></div>
              <div className="absolute top-1/3 left-0 w-8 h-8 bg-brand-tertiary-soft rounded-full animate-bounce [animation-delay:1.5s]"></div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24 space-y-4">
          <section id="service" className="scroll-mt-24">
            <Card>
              <CardHeader className="text-2xl font-bold">Service</CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  We offer a range of services to help you create, manage, and
                  join events. Whether you're looking to host a community
                  gathering or simply connect with like-minded individuals, we
                  have you covered. We offer a range of services to help you
                  create, manage, and join events. Whether you're looking to
                  host a community gathering or simply connect with like-minded
                  individuals, we have you covered. We offer a range of services
                  to help you create, manage, and join events. Whether you're
                  looking to host a community gathering or simply connect with
                  like-minded individuals, we have you covered.
                </p>
              </CardContent>
            </Card>
          </section>
          <section id="about" className="scroll-mt-24">
            <Card>
              <CardHeader className="text-2xl font-bold">About Us</CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  We offer a range of services to help you create, manage, and
                  join events. Whether you're looking to host a community
                  gathering or simply connect with like-minded individuals, we
                  have you covered. We offer a range of services to help you
                  create, manage, and join events. Whether you're looking to
                  host a community gathering or simply connect with like-minded
                  individuals, we have you covered. We offer a range of services
                  to help you create, manage, and join events. Whether you're
                  looking to host a community gathering or simply connect with
                  like-minded individuals, we have you covered.
                </p>
              </CardContent>
            </Card>
          </section>
          <section id="contact" className="scroll-mt-24">
            <Card>
              <CardHeader className="text-2xl font-bold">Contact</CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  We offer a range of services to help you create, manage, and
                  join events. Whether you're looking to host a community
                  gathering or simply connect with like-minded individuals, we
                  have you covered. We offer a range of services to help you
                  create, manage, and join events. Whether you're looking to
                  host a community gathering or simply connect with like-minded
                  individuals, we have you covered.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Features Section */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Create Events
                </h3>
                <p className="text-muted-foreground">
                  Launch your own events easily and reach people who share your
                  passions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Join Communities
                </h3>
                <p className="text-muted-foreground">
                  Discover events you love and meet like‑minded people along the
                  way.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <IdCard className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Build Your Profile
                </h3>
                <p className="text-muted-foreground">
                  Show who you are and let others discover your interests.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
