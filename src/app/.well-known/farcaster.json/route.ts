import { NextResponse } from 'next/server';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return NextResponse.json({
    "accountAssociation": {
      "header": "eyJmaWQiOjI4NTUsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgzMjEzN2YwRDVBNjgxYzJCQkIzQzAxQkRGNWI2ZTNjMzcxNUREMmRBIn0",
      "payload": "eyJkb21haW4iOiJhcG9zdGxlLW1pbnQudmVyY2VsLmFwcCJ9",
      "signature": "jJ9bh4XFvITjeqVk7iis1istK63oB7lvfBnISb0xovk/tezrNN/AzI0yZgxTZBJA+CYXN0RizVqQCyJqZPorqRw="
    },
    "frame": {
      "version": "1",
      "name": "Example Frame",
      "iconUrl": `${appUrl}/icon.png`,
      "homeUrl": appUrl,
      "imageUrl": `${appUrl}/image.png`,
      "buttonTitle": "Check this out",
      "splashImageUrl": `${appUrl}/splash.png`,
      "splashBackgroundColor": "#eeccff",
      "webhookUrl": `${appUrl}/api/webhook`
    }
  });
}
