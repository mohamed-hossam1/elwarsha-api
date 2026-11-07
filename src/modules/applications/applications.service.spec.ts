import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "../../common/errors.js";
import { ApplicationsService } from "./applications.service.js";
import type { ApplyCohortDto } from "./dto/apply-cohort.dto.js";

describe("ApplicationsService", () => {
  let service: ApplicationsService;

  const validApplication: ApplyCohortDto = {
    fullName: "Sara Mahmoud",
    email: "sara@example.com",
    whatsappNumber: "+201098765432",
    githubHandle: "sara-mahmoud",
    discordHandle: "sara_dev",
    currentStatus: "student",
    collegeMajor: "Computer Science",
    programmingExperience: "1 year",
    technologies: "JavaScript, TypeScript, React",
    gitExperience: "basics",
    personalPageUrl: "https://sara.github.io",
    githubRepoUrl: "https://github.com/sara/personal-page",
    aiUsage: "Used AI for drafting and learning.",
    motivation:
      "I am highly committed to building hands-on full-stack features and contributing to open-source software in ElWarsha Cohort 2.",
  };

  beforeEach(() => {
    service = new ApplicationsService();
  });

  it("returns a receipt with an app_ id and status received for a valid application", async () => {
    const receipt = await service.apply("cohort-2", validApplication);

    expect(receipt).toMatchObject({
      cohortSlug: "cohort-2",
      email: "sara@example.com",
      status: "received",
    });
    expect(receipt.id).toMatch(/^app_[a-f0-9]{8}$/);
    expect(receipt.createdAt).toBeDefined();
  });

  it("rejects duplicate email ignoring case with ConflictError", async () => {
    await service.apply("cohort-2", validApplication);

    const duplicateUpperEmail: ApplyCohortDto = {
      ...validApplication,
      email: "SARA@EXAMPLE.COM",
      githubHandle: "different-handle",
    };

    await expect(service.apply("cohort-2", duplicateUpperEmail)).rejects.toThrow(
      ConflictError,
    );
  });

  it("rejects duplicate GitHub handle with a different email", async () => {
    await service.apply("cohort-2", validApplication);

    const duplicateGithubHandle: ApplyCohortDto = {
      ...validApplication,
      email: "other@example.com",
      githubHandle: "SARA-MAHMOUD",
    };

    await expect(service.apply("cohort-2", duplicateGithubHandle)).rejects.toThrow(
      ConflictError,
    );
  });

  it("accepts the same applicant in a different cohort", async () => {
    const receipt1 = await service.apply("cohort-1", validApplication);
    const receipt2 = await service.apply("cohort-2", validApplication);

    expect(receipt1.cohortSlug).toBe("cohort-1");
    expect(receipt2.cohortSlug).toBe("cohort-2");
    expect(receipt1.id).not.toBe(receipt2.id);
  });

  it("clears stored applications when reset() is called", async () => {
    await service.apply("cohort-2", validApplication);

    service.reset();

    const stored = await service.findByCohort("cohort-2");
    expect(stored).toHaveLength(0);

    const receipt = await service.apply("cohort-2", validApplication);
    expect(receipt.id).toMatch(/^app_/);
  });
});
