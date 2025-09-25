# Sync My Calendar

A modern calendar application built with React, TypeScript, and Tailwind CSS that offers seamless event management and Google Calendar synchronization.

## Features

- 🗓️ Monthly and Weekly calendar views
- 🌓 Dark/Light theme support with system preference detection
- 🔄 Google Calendar synchronization
- 📅 Event management (Create, Read, Update, Delete)
- ⏰ Event reminders and notifications
- 📱 Responsive design for all devices
- 🎨 Modern UI with shadcn/ui components

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui Components
- date-fns for date manipulation
- Google Calendar API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or Bun package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd sync-my-cal-61
```

2. Install dependencies:
```bash
# Using npm
npm install

# Using Bun
bun install
```

3. Start the development server:
```bash
# Using npm
npm run dev

# Using Bun
bun dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Calendar Views
- Toggle between Monthly and Weekly views using the view selector
- Navigate through months/weeks using arrow buttons or click "Today" to return to current date
- Click on any day to add a new event
- View event details by clicking on existing events

### Event Management
- Create new events by clicking on a day or the "Add Event" button
- Edit events by clicking on existing events
- Delete events through the event modal
- Set reminders for important events

### Theme Switching
- Click the theme toggle button in the navbar to switch between light and dark modes
- Automatically adapts to system preferences

### Google Calendar Sync
- Connect your Google Calendar account in the Settings tab
- Sync events bidirectionally between the app and Google Calendar
- Manage sync preferences and settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [date-fns](https://date-fns.org/) for date manipulation utilities
- [Lucide Icons](https://lucide.dev/) for the icon set
