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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/10 via-transparent to-transparent"></div>

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
                  <Link href="#contact">
                    <span className="text-lg font-medium">Contact</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Image Area */}
            <div className="relative">
              <div className="overflow-hidden border-border/60">
                <div className="aspect-4/3 bg-card/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
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
                  join events. Whether you&apos;re looking to host a community
                  gathering or simply connect with like-minded individuals, we
                  have you covered. We offer a range of services to help you
                  create, manage, and join events. Whether you&apos;re looking to
                  host a community gathering or simply connect with like-minded
                  individuals, we have you covered. We offer a range of services
                  to help you create, manage, and join events. Whether you&apos;re
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
                <p className="text-muted-foreground mb-8">
                  This website was created as a project for course 261492 by a
                  group of fourth-year students from the Department of Computer
                  Engineering, Faculty of Engineering, Chiang Mai University.
                </p>

                {/* Team Members Section */}
                <div className="mt-12">
                  <h3 className="text-xl font-semibold mb-6 text-center">
                    Our Team
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Team Member 1 */}
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src="/Apiwit.jpg"
                            alt="Apiwit Boonyarit"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">
                          Apiwit Boonyarit
                        </h4>
                        <p className="text-muted-foreground">
                          Front-end Developer
                        </p>
                        <p className="text-muted-foreground">650612106</p>
                      </CardContent>
                    </Card>

                    {/* Team Member 2 */}
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src="/Autsada.jpg"
                            alt="Autsada Wiriya"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">
                          Autsada Wiriya
                        </h4>
                        <p className="text-muted-foreground">
                          Fullstack Developer
                        </p>
                        <p className="text-muted-foreground">650612107</p>
                      </CardContent>
                    </Card>

                    {/* Team Member 3 */}
                    <Card className="text-center">
                      <CardContent className="p-6">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src="/UeaAR.jpg"
                            alt="Ueaarthorn Uawongtrakul"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">
                          Ueaarthorn Uawongtrakul
                        </h4>
                        <p className="text-muted-foreground">
                          Project Manager,UX/UI Design,Front-end Developer
                        </p>
                        <p className="text-muted-foreground">650612171</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          <section id="contact" className="scroll-mt-24">
  <Card>
    <CardHeader className="text-2xl font-bold">Contact</CardHeader>
    <CardContent className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">ติดต่อเรา</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">ที่อยู่:</strong><br/>
                ภาควิชาวิศวกรรมคอมพิวเตอร์ ชั้น 4 ตึก 30 ปี<br/>
                คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่<br/>
                239 ถนนห้วยแก้ว ตำบลสุเทพ อำเภอเมือง<br/>
                จังหวัดเชียงใหม่ 50200
              </p>
              <p>
                <strong className="text-foreground">โทรศัพท์:</strong><br/>
                0-5394-2023, 0-5394-2072
              </p>
              <p>
                <strong className="text-foreground">อีเมล:</strong><br/>
                cpe@eng.cmu.ac.th
              </p>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="h-80 lg:h-96">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3777.0234567890123!2d98.95240731234567!3d18.80123456789012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30da3a9a36ded807%3A0x984b50b2f3b5c5e6!2sDepartment%20of%20Computer%20Engineering%2C%20Chiang%20Mai%20University!5e0!3m2!1sen!2sth!4v1234567890123!5m2!1sen!2sth"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ภาควิชาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยเชียงใหม่"
            ></iframe>
          </div>
        </div>
      </div>
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
