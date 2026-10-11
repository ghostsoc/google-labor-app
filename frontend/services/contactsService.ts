import { Client, StaffMember } from '../types';

export interface GooglePersonContact {
  resourceName: string;
  etag?: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  photoUrl?: string;
}

/**
 * Fetches connections (contacts) from Google People API
 */
export async function fetchGoogleContacts(accessToken: string): Promise<GooglePersonContact[]> {
  const params = new URLSearchParams({
    personFields: 'names,emailAddresses,phoneNumbers,organizations,addresses,photos',
    pageSize: '100',
    sortOrder: 'FIRST_NAME_ASCENDING',
  });

  const res = await fetch(`https://people.googleapis.com/v1/people/me/connections?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Contacts (${res.status})`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((c: any) => {
    const nameObj = c.names?.[0] || {};
    const emailObj = c.emailAddresses?.[0] || {};
    const phoneObj = c.phoneNumbers?.[0] || {};
    const orgObj = c.organizations?.[0] || {};
    const addrObj = c.addresses?.[0] || {};
    const photoObj = c.photos?.[0] || {};

    const displayName =
      nameObj.displayName ||
      `${nameObj.givenName || ''} ${nameObj.familyName || ''}`.trim() ||
      emailObj.value ||
      'Unnamed Contact';

    return {
      resourceName: c.resourceName,
      etag: c.etag,
      displayName,
      givenName: nameObj.givenName,
      familyName: nameObj.familyName,
      email: emailObj.value,
      phone: phoneObj.value,
      company: orgObj.name,
      jobTitle: orgObj.title,
      address: addrObj.formattedValue,
      photoUrl: photoObj.url,
    };
  });
}

/**
 * Creates a new contact in Google People API
 */
export async function createGoogleContact(
  contact: {
    givenName: string;
    familyName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    notes?: string;
  },
  accessToken: string
): Promise<GooglePersonContact> {
  const body: any = {
    names: [
      {
        givenName: contact.givenName,
        familyName: contact.familyName || '',
      },
    ],
  };

  if (contact.email) {
    body.emailAddresses = [{ value: contact.email, type: 'work' }];
  }
  if (contact.phone) {
    body.phoneNumbers = [{ value: contact.phone, type: 'work' }];
  }
  if (contact.company || contact.jobTitle) {
    body.organizations = [
      {
        name: contact.company || '',
        title: contact.jobTitle || '',
      },
    ];
  }
  if (contact.notes) {
    body.biographies = [{ value: contact.notes, contentType: 'TEXT_PLAIN' }];
  }

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Contact (${res.status})`);
  }

  const created = await res.json();
  const nameObj = created.names?.[0] || {};
  return {
    resourceName: created.resourceName,
    displayName: nameObj.displayName || `${contact.givenName} ${contact.familyName || ''}`.trim(),
    givenName: contact.givenName,
    familyName: contact.familyName,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    jobTitle: contact.jobTitle,
  };
}

/**
 * Exports an In The Wind AV Client to Google Contacts
 */
export async function exportClientToGoogleContacts(
  client: Client,
  accessToken: string
): Promise<GooglePersonContact> {
  const parts = client.name.split(' ');
  const givenName = parts[0] || client.name;
  const familyName = parts.slice(1).join(' ');

  return await createGoogleContact(
    {
      givenName,
      familyName,
      email: client.email,
      phone: client.phone,
      company: client.company,
      jobTitle: 'Production Client',
      notes: `Terms: ${client.billingTerms}. Tax exempt: ${client.taxExempt ? 'Yes' : 'No'}. ${client.notes || ''}`,
    },
    accessToken
  );
}

/**
 * Exports an In The Wind AV Staff Member to Google Contacts
 */
export async function exportStaffToGoogleContacts(
  staff: StaffMember,
  accessToken: string
): Promise<GooglePersonContact> {
  const parts = staff.name.split(' ');
  const givenName = parts[0] || staff.name;
  const familyName = parts.slice(1).join(' ');

  return await createGoogleContact(
    {
      givenName,
      familyName,
      email: staff.email,
      phone: staff.phone,
      company: 'In The Wind AV Crew',
      jobTitle: staff.role,
      notes: `Day Rate: $${staff.dayRate}, Hourly: $${staff.hourlyRate}. Status: ${staff.status}. ${staff.notes || ''}`,
    },
    accessToken
  );
}
