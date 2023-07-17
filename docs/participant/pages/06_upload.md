# Upload

## About This Page

​​We use the participant's situation to determine which kinds of documents, if any, they need to provide:

- If they don't have adjunctive eligibility, they always need to upload proof of income.
- If they moved, they need to provide proof of address.
- If they changed their name and/or their previous ID doc expired, they need to provide new proof of identity.

## Considerations for Other States

What are your policies around verifying identity and address?
If you require documents in all scenarios, you may be able to simplify this document upload flow.

## Development

The Upload page renders a [`<FileUploader>`](../../../participant/app/components/FileUploader.tsx) component, as well as a separate group of [`<FilePreview>`](../../../participant/app/components/FilePreview.tsx) components for files previously uploaded. (The `<FileUploader>` component also contains `<FilePreview>` components for uploads done in the current page load)

#### Upload Flow

1.  The participant drops a file or selects a file with the picker
2.  The page requests a signed S3/Minio PUT URL via the `Loader` on the [upload.tsx](../../../participant/app/routes/%24localAgency/recertify/upload.tsx) page
3.  The page creates a `Document` record and responds with a signed PUT URL in the `Loader` code
4.  The client-side Javascript streams the file contents to the PUT URL via Fetch
5.  The state of the `<FileUpload>` component is updated to render a `<FilePreview>` component for the newly uploaded file
6.  If the participant clicks the `Remove File` button, the client-side Javascript sends a GET request to the `Loader` using Fetch asking the `Loader` to delete the file object from S3/Minio and to delete the `Document` record from the database
7.  After the `Remove File` button click, the `<FileUpload>` component removes the `<FilePreview>` from the state for that file

The form completion button is gated on all upload promises being complete (that is, if any stream is still uploading, the participant cannot click the button to proceed from the page)

If navigation interrupts the upload stream, the client Javascript sends a GET request to the `Loader` asking the `Loader` to delete the file object from S3/Minio and to delete the `Document` record from the database

#### Previously Uploaded Files Flow

1.  On a return to the page, the `Loader` on the [upload.tsx](../../../participant/app/routes/%24localAgency/recertify/upload.tsx) page returns a list of filenames and signed S3/Minio GET URLs (to retrieve the files for preview thumbnails)
2.  The page rendering code creates a list of `<FilePreview>` components, one for each file returned from the `Loader`
3.  If the participant clicks on a `Remove File` button, the client-side Javascript sends a GET request to the `Loader` using Fetch asking the `Loader` to delete the file object from S3/Minio and to delete the `Document` record from the database
4.  After the `Remove File` button click, the page removes the `<FilePreview>` component from the state for that file

This page will be **skipped** if all participants entered on the `Details` page have adjunctive eligibility, and if there were no changes (all "no" answers) on the `Changes` page.

Submitted details are stored in the database in an equal number of `Document` records, and file objects are stored in S3

The contents of this page are controlled by three things -

- Files uploaded previously in `Document` records and rerendered as `<FilePreview>` components upon return to the page
- The layout contained in [app/routes/$localAgency/recertify/upload.tsx](../../../participant/app/routes/%24localAgency/recertify/upload.tsx)
- The i18next strings for the `"Upload"` and `"FileUploader"` keys in [public/locales/en/common.json](../../../participant/public/locales/en/common.json)
