import React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Calendar, FileText, Anchor, Users, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <Head>
        <title>SailLink - Sailing Club Management Platform</title>
        <meta name="description" content="Your sailing club's central hub for events, race documents, and important links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-background min-h-screen flex flex-col">
        <Header />
        
        {/* Hero Section */}
        <section className="relative h-[90vh] w-full">
          <div className="absolute inset-0">
            <Image
              src="/images/rect.png"
              alt="Sailing boat aerial view"
              fill
              className="object-cover brightness-50"
            />
          </div>
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl text-white">
              <h1 className="text-5xl font-bold mb-6">Freedom is just an anchor away</h1>
              <p className="text-xl mb-8 text-gray-200">
                Streamline your sailing club management with our comprehensive platform
              </p>
              <div className="flex gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                    Get Started
                  </Button>
                </Link>
                <Link href="/calendar">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                    View Calendar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Sail Away to Something Great</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience seamless club management with our comprehensive suite of tools
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <Calendar className="w-10 h-10 text-primary mb-4" />
                  <CardTitle>Event Management</CardTitle>
                  <CardDescription>
                    Organize races and social events with ease
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <FileText className="w-10 h-10 text-primary mb-4" />
                  <CardTitle>Document Control</CardTitle>
                  <CardDescription>
                    Centralize all your club documentation
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <CardTitle>Member Portal</CardTitle>
                  <CardDescription>
                    Manage memberships and permissions
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your Perfect Plan</h2>
              <p className="text-gray-600">Select the best option for your sailing club</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Basic</CardTitle>
                  <div className="text-4xl font-bold my-4">$39<span className="text-lg text-gray-500">/mo</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 text-primary mr-2" />Up to 10 events/month</li>
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 text-primary mr-2" />Basic event management</li>
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 text-primary mr-2" />Document storage</li>
                  </ul>
                  <Button className="w-full mt-6">Get Started</Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-primary text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <div className="text-4xl font-bold my-4">$79<span className="text-lg opacity-75">/mo</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 mr-2" />Up to 50 events/month</li>
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 mr-2" />Advanced event tools</li>
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 mr-2" />Premium support</li>
                  </ul>
                  <Button className="w-full mt-6 bg-white text-primary hover:bg-gray-100">Get Started</Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Enterprise</CardTitle>
                  <div className="text-4xl font-bold my-4">$149<span className="text-lg text-gray-500">/mo</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 text-primary mr-2" />Unlimited events</li>
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 text-primary mr-2" />Custom event features</li>
                    <li className="flex items-center"><ChevronRight className="w-5 h-5 text-primary mr-2" />24/7 priority support</li>
                  </ul>
                  <Button className="w-full mt-6">Contact Sales</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">We're Water Good Racing Happens</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join the growing community of sailing clubs that trust SailLink
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Set Sail?</h2>
            <p className="mb-8 text-lg opacity-90">Start managing your sailing club more effectively today</p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}