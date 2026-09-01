"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useCommunityStore,
  COLLEGES,
  COURSES,
  YEARS,
} from "@/lib/community-store";
import { Sparkles, User, GraduationCap, School, Calendar, AtSign } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunityOnboardingModal({ open, onOpenChange }: Props) {
  const { profile, updateProfile } = useCommunityStore();

  const [alias, setAlias] = useState(profile.alias || "");
  const [username, setUsername] = useState(profile.username?.replace("@", "") || "");
  const [college, setCollege] = useState(profile.college || COLLEGES[0]);
  const [course, setCourse] = useState(profile.course || COURSES[0]);
  const [year, setYear] = useState(profile.year || YEARS[0]);
  const [bio, setBio] = useState(profile.bio || "");

  const handleSave = () => {
    if (!alias.trim()) {
      toast.error("Please enter a scholar alias or name");
      return;
    }
    if (!username.trim()) {
      toast.error("Please choose a unique username");
      return;
    }

    const cleanHandle = `@${username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")}`;

    updateProfile({
      alias: alias.trim(),
      username: cleanHandle,
      college,
      course,
      year,
      bio: bio.trim(),
      isSetupComplete: true,
    });

    toast.success("Scholar profile configured!", {
      description: `Welcome to the community as ${alias} (${cleanHandle})`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg liquid-glass border-white/20 dark:border-white/10 p-6 sm:p-8 rounded-3xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Scholar Community Identity
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Customize your unique scholar alias, handle, college, course, and academic year to join verified peer communities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Alias & Unique Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Scholar Alias / Name</span>
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g. Quantum Sage"
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-primary" />
                <span>Unique Username</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="quantum_sage"
                  className="w-full text-xs font-mono font-semibold pl-7 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* College Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-indigo-400" />
              <span>University / College</span>
            </label>
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              {COLLEGES.map((c) => (
                <option key={c} value={c} className="bg-background text-foreground">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Course & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Degree & Major</span>
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                {COURSES.map((c) => (
                  <option key={c} value={c} className="bg-background text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Academic Year</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-background text-foreground">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
              Academic Bio & Research Interests
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Studying Transformers, Graph Theory, and Distributed Systems..."
              className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl text-xs font-bold border-white/20 bg-white/5"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="rounded-2xl text-xs font-bold px-5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            >
              Save Scholar Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
