// Edit this file to customize the invitation. No build step is needed.
window.NIGHTLIST = {
  ticketEyebrow: "YOU’RE INVITED",
  ticketTitleFirst: "GUEST",
  ticketTitleSecond: "LIST",
  eventName: "DIWALI NIGHT",
  ticketDate: "24 OCTOBER 2026",
  ticketTime: "5 PM - OVERNIGHT",
  ticketVenue: "DIWALI NIGHT, NOIDA",
  posterTitleFirst: "DIWALI",
  posterTitleSecond: "NIGHT",
  posterVenue: "DIWALI NIGHT, NOIDA",
  posterDate: "24 OCTOBER 2026",
  posterSchedule: "5 PM - OVERNIGHT",
  photoDate: "24.10",
  organisers: ["RIPUL", "PRATHAM", "MEHAK", "CHAYAN", "UJJWAL"],
  factDate: "24 OCT",
  factDoors: "5 PM",
  factCity: "NOIDA",
  contribution: "CONTACT ORGANISERS",
  mapUrl: "https://tinyurl.com/5a5rje48",
  // The original DJ set is split into host-friendly parts without re-encoding.
  musicSegments: [
    { src: "assets/stuvi-diwali-set-00.mp3", duration: 1145.025306 },
    { src: "assets/stuvi-diwali-set-01.mp3", duration: 1144.999184 },
    { src: "assets/stuvi-diwali-set-02.mp3", duration: 1135.098776 }
  ],
  photos: [
    "assets/guest-dance.jpg",
    "assets/sparkler-dance.jpg",
    "assets/uno-night.jpg",
    "assets/sparklers-circle.jpg",
    "assets/friends-party.jpg",
    "assets/fireworks-night.jpg"
  ],
  // Hosted RSVP form writes to the private Google Sheet without guest sign-in.
  rsvpFormUrl: "https://script.google.com/macros/s/AKfycby0QzTWU9uSHmEzj4CTj026ckNzbY6w7hrRgnutqEfTW9DTnCZgDC2x1DMOLEtx-gL0/exec",
  // Optional same-origin Worker endpoint if that bridge is deployed later.
  rsvpEndpoint: ""
};
