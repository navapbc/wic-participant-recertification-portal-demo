import { prismaMock } from "tests/helpers/prismaMock";
import {
  findSubmission,
  upsertSubmission,
  findLocalAgency,
  firstLocalAgency,
  findSubmissionFormData,
  upsertSubmissionForm,
  findDocument,
  deleteDocument,
  upsertDocument,
  listDocuments,
  listExpiringDocuments,
  updateDocumentS3Url,
  upsertStaffUser,
  fetchSubmissionData,
} from "app/utils/db.server";
import { v4 as uuidv4 } from "uuid";

import {
  getLocalAgency,
  getCurrentSubmission,
  getDocument,
  getStaffUser,
  getSubmissionForm,
} from "tests/helpers/mockData";

it("finds a submission", async () => {
  const submissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(submissionID);
  prismaMock.submission.findUnique.mockResolvedValue(mockSubmission);
  const foundSubmission = await findSubmission(submissionID);
  expect(prismaMock.submission.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
    })
  );
  expect(foundSubmission).toMatchObject(mockSubmission);
});

it("finds a localAgency", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const foundAgency = await findLocalAgency("agency");
  expect(prismaMock.localAgency.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { urlId: "agency" },
    })
  );
  expect(foundAgency).toMatchObject(mockAgency);
});

it("upserts a submission and looks up localagency", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const submissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(submissionID);
  prismaMock.submission.upsert.mockResolvedValue(mockSubmission);
  const upsertedSubmission = await upsertSubmission(submissionID, "agency");
  expect(prismaMock.localAgency.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { urlId: "agency" },
    })
  );
  // There is an updatedAt here.. but we'd have to do some fudging to
  // not run into race conditions for timestamp values
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
      create: {
        submissionId: submissionID,
        localAgencyId: mockAgency.localAgencyId,
      },
    })
  );
  expect(upsertedSubmission).toMatchObject(mockSubmission);
});

it("updates submission to submitted", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const submissionID = uuidv4();
  const mockSubmission = getCurrentSubmission(submissionID);
  prismaMock.submission.upsert.mockResolvedValue(mockSubmission);
  await upsertSubmission(submissionID, mockAgency.urlId, true);
  expect(prismaMock.submission.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { submissionId: submissionID },
      update: expect.objectContaining({
        submitted: true,
      }),
    })
  );
});

it("upserting a submission throws an exception if there is no agency", async () => {
  const submissionID = uuidv4();
  prismaMock.localAgency.findUnique.mockResolvedValue(null);
  await expect(async () => {
    await upsertSubmission(submissionID, "bogus");
  }).rejects.toThrow(`Unable to find agency for bogus`);
});

it("finds the firstLocalAgency", async () => {
  const mockAgencyFirst = getLocalAgency();
  prismaMock.localAgency.findFirst.mockResolvedValue(mockAgencyFirst);
  const foundAgency = await firstLocalAgency();
  expect(prismaMock.localAgency.findFirst).toHaveBeenCalled();
  expect(foundAgency).toMatchObject(mockAgencyFirst);
});

it("finds submission form data", async () => {
  const submissionID = uuidv4();
  const mockFormData = {
    comments: "Coffee is delightful",
  };
  const mockSubmissionForm = getSubmissionForm(
    submissionID,
    "changes",
    mockFormData
  );
  prismaMock.submissionForm.findFirst.mockResolvedValue(mockSubmissionForm);
  const foundSubmissionForm = await findSubmissionFormData(
    submissionID,
    "changes"
  );
  expect(prismaMock.submissionForm.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        formRoute: "changes",
      },
      select: {
        formData: true,
      },
    })
  );
  expect(foundSubmissionForm).toEqual(mockFormData);
});

it("updates a submissionForm if one exists", async () => {
  const submissionID = uuidv4();
  const mockFormData = {
    comments: "Coffee is delightful",
  };
  const mockSubmissionForm = getSubmissionForm(
    submissionID,
    "changes",
    mockFormData
  );
  prismaMock.submissionForm.findFirst.mockResolvedValue(mockSubmissionForm);
  await upsertSubmissionForm(submissionID, "changes", mockFormData);
  expect(prismaMock.submissionForm.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        formRoute: "changes",
      },
    })
  );
  expect(prismaMock.submissionForm.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionFormId: mockSubmissionForm.submissionFormId,
      },
    })
  );
});

it("creates a submissionForm if one does not exist", async () => {
  const submissionID = uuidv4();
  const mockFormData = {
    comments: "Coffee is delightful",
  };
  await upsertSubmissionForm(submissionID, "changes", mockFormData);
  expect(prismaMock.submissionForm.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        formRoute: "changes",
      },
    })
  );
  expect(prismaMock.submissionForm.create).toHaveBeenCalledWith({
    data: {
      submissionId: submissionID,
      formRoute: "changes",
      formData: mockFormData,
    },
  });
});

it("finds a document", async () => {
  const submissionID = uuidv4();
  const mockument = getDocument(submissionID, "filename.jpg");
  prismaMock.document.findFirst.mockResolvedValue(mockument);
  const foundDocument = await findDocument(submissionID, "filename.jpg");
  expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        originalFilename: "filename.jpg",
      },
    })
  );
  expect(foundDocument).toMatchObject(mockument);
});

it("deletes a document", async () => {
  const submissionID = uuidv4();
  const mockument = getDocument(submissionID, "filename.jpg");
  prismaMock.document.findFirst.mockResolvedValue(mockument);
  await deleteDocument(submissionID, "filename.jpg");
  expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        originalFilename: "filename.jpg",
      },
    })
  );
  expect(prismaMock.document.delete).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        documentId: mockument.documentId,
      },
    })
  );
});

it("updates a document if one exists", async () => {
  const submissionID = uuidv4();
  const mockument = getDocument(submissionID, "filename.jpg");
  prismaMock.document.findFirst.mockResolvedValue(mockument);
  await upsertDocument(submissionID, {
    filename: "filename.jpg",
    accepted: true,
  });
  expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        originalFilename: "filename.jpg",
      },
    })
  );
  expect(prismaMock.document.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        documentId: mockument.documentId,
      },
    })
  );
});

it("creates a document if one does not exist", async () => {
  const submissionID = uuidv4();
  const mockument = getDocument(submissionID, "filename.jpg");
  prismaMock.document.findFirst.mockResolvedValue(null);
  await upsertDocument(submissionID, {
    filename: "filename.jpg",
    accepted: true,
    key: mockument.s3Key,
    s3Url: mockument.s3Url,
    size: mockument.detectedFilesizeBytes!,
    mimeType: mockument.detectedFiletype!,
  });
  expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: submissionID,
        originalFilename: "filename.jpg",
      },
    })
  );
  expect(prismaMock.document.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        submissionId: submissionID,
        s3Key: mockument.s3Key,
        s3Url: mockument.s3Url,
        detectedFiletype: mockument.detectedFiletype,
        detectedFilesizeBytes: mockument.detectedFilesizeBytes,
        originalFilename: mockument.originalFilename,
      },
    })
  );
});

it("lists documents", async () => {
  const submissionID = uuidv4();
  const mockument = getDocument(submissionID, "filename.jpg");
  const mockumentTwo = getDocument(
    submissionID,
    "another-file.png",
    "image/png",
    2_048_000
  );

  prismaMock.document.findMany.mockResolvedValue([mockument, mockumentTwo]);
  const foundDocuments = await listDocuments(submissionID);
  expect(foundDocuments.length).toBe(2);
  expect(prismaMock.document.findMany).toHaveBeenCalledWith({
    where: { submissionId: submissionID },
    select: {
      s3Key: true,
      s3Url: true,
      originalFilename: true,
    },
  });
  expect(foundDocuments[0]).toEqual(mockument);
  expect(foundDocuments[1]).toEqual(mockumentTwo);
});

it("lists documents with expiring s3 presigned urls", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2020-01-10"));
  const submissionID = uuidv4();
  const mockument = getDocument(
    submissionID,
    "another-file.png",
    "image/png",
    1_024_000,
    new Date("2020-01-01")
  );

  prismaMock.document.findMany.mockResolvedValue([mockument]);
  const foundDocuments = await listExpiringDocuments();
  expect(foundDocuments.length).toBe(1);
  expect(prismaMock.document.findMany).toHaveBeenCalledWith({
    where: {
      updatedAt: {
        lt: new Date("2020-01-09T17:00:00.000Z"),
      },
    },
    select: {
      originalFilename: true,
      s3Key: true,
      submissionId: true,
      updatedAt: true,
    },
  });
  expect(foundDocuments[0]).toEqual(mockument);
});

it("updating a document s3 url throws an exception if there is no document", async () => {
  const submissionId = uuidv4();
  const filename = "bogusfile";
  const s3Url = "boguss3url";
  prismaMock.document.findFirst.mockResolvedValue(null);
  await expect(async () => {
    await updateDocumentS3Url(submissionId, filename, s3Url);
  }).rejects.toThrow(`Unable to find document for ${submissionId} ${filename}`);
});

it("updating a document s3 url looks up the document and updates the s3 url and updatedAt", async () => {
  const mockument = getDocument();
  prismaMock.document.findFirst.mockResolvedValue(mockument);
  const updatedS3Url = `http://127.0.0.1/${mockument.submissionId}/${mockument.originalFilename}?updated`;
  await updateDocumentS3Url(
    mockument.submissionId,
    mockument.originalFilename,
    updatedS3Url
  );
  expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        submissionId: mockument.submissionId,
        originalFilename: mockument.originalFilename,
      },
    })
  );
  expect(prismaMock.document.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        documentId: mockument.documentId,
      },
    })
  );
});

it("upserting a staff user looks up localagency and creates a staff user if there is none", async () => {
  const mockAgency = getLocalAgency();
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgency);
  const mockStaffUser = getStaffUser(mockAgency.localAgencyId);
  await upsertStaffUser(mockAgency.urlId, mockStaffUser.staffUserId);
  expect(prismaMock.localAgency.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { urlId: "agency" },
    })
  );
  // There is an updatedAt here.. but we'd have to do some fudging to
  // not run into race conditions for timestamp values
  expect(prismaMock.staffUser.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { staffUserId: mockStaffUser.staffUserId },
      create: {
        staffUserId: mockStaffUser.staffUserId,
        localAgencyId: mockAgency.localAgencyId,
      },
    })
  );
});

it("upserting a staff user throws an exception if there is no agency", async () => {
  const staffUserId = uuidv4();
  prismaMock.localAgency.findUnique.mockResolvedValue(null);
  await expect(async () => {
    await upsertStaffUser("bogus", staffUserId);
  }).rejects.toThrow(`Unable to find agency for bogus`);
});

it("upserting a staff user updates existing staff users", async () => {
  const mockAgencyOne = getLocalAgency("one");
  const mockAgencyTwo = getLocalAgency("two");
  prismaMock.localAgency.findUnique.mockResolvedValue(mockAgencyTwo);
  const mockStaffUser = getStaffUser(mockAgencyOne.localAgencyId);
  prismaMock.staffUser.upsert.mockResolvedValue(mockStaffUser);
  // Update the local agency from ONE to TWO
  const upsertedStaffUser = await upsertStaffUser(
    mockAgencyTwo.urlId,
    mockStaffUser.staffUserId
  );
  expect(prismaMock.localAgency.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { urlId: "two" },
    })
  );
  // There is an updatedAt here.. but we'd have to do some fudging to
  // not run into race conditions for timestamp values
  expect(prismaMock.staffUser.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { staffUserId: mockStaffUser.staffUserId },
      create: {
        staffUserId: mockStaffUser.staffUserId,
        localAgencyId: mockAgencyTwo.localAgencyId,
      },
    })
  );
  expect(upsertedStaffUser).toMatchObject({
    staffUserId: mockStaffUser.staffUserId,
    localAgencyId: mockAgencyOne.localAgencyId,
  });
});

it("marshals submission data", async () => {
  const submissionID = uuidv4();

  const formData = [
    getSubmissionForm(submissionID, "name", {
      lastName: "McGuffin",
      firstName: "Amathar",
    }),
    getSubmissionForm(submissionID, "changes", {
      idChange: "no",
      addressChange: "yes",
    }),
    getSubmissionForm(submissionID, "details", [
      {
        dob: { day: 1, year: 2001, month: 1 },
        tag: "iml60gLz26YFfVafywFsp",
        lastName: "Parker",
        firstName: "Florence",
        adjunctive: "yes",
        relationship: "child",
      },
    ]),
    getSubmissionForm(submissionID, "contact", {
      phoneNumber: "2234567890",
      additionalInfo: "Example Comment Contents",
    }),
  ];
  const mockument = getDocument(submissionID, "filename.jpg");
  prismaMock.submissionForm.findMany.mockResolvedValue(formData);
  prismaMock.document.findMany.mockResolvedValue([mockument]);
  const submissionData = await fetchSubmissionData(submissionID);
  expect(prismaMock.submissionForm.findMany).toHaveBeenCalledWith({
    where: {
      submissionId: submissionID,
    },
    select: {
      formRoute: true,
      formData: true,
    },
  });
  expect(prismaMock.document.findMany).toHaveBeenCalledWith({
    where: { submissionId: submissionID },
    select: {
      s3Key: true,
      s3Url: true,
      originalFilename: true,
    },
  });
  expect(submissionData).toBeDefined();
  expect(submissionData.participant).toBeDefined();
  const participants = submissionData!.participant!;
  expect(participants[0].tag).toBe("iml60gLz26YFfVafywFsp");
});
