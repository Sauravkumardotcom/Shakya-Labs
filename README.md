# Shakya Labs

A beautiful, modern website built with React, Tailwind CSS, and Vite. Featuring a professional portfolio, services showcase, and a special birthday celebration page.

## Features

- ✨ **Responsive Design** - Works perfectly on all devices
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🌐 **Bilingual** - English and Hindi language support
- 💌 **Contact Form** - Email integration with backend
- 🎂 **Birthday Page** - Special countdown and celebration page
- ⚡ **Fast Performance** - Built with Vite for optimal speed
- 🎨 **Modern UI** - Beautiful gradient designs and animations

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Email**: Nodemailer
- **Language**: JavaScript/JSX

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/Sauravkumardotcom/Shakya-Labs.git
cd shakya-labs
```

2. Install dependencies
```bash
npm install
```

3. Create environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Gmail credentials
```

4. Start development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Note**: Never commit `.env.local` to version control

## Gmail Setup

To send emails through Gmail:

1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for Mail
4. Copy the 16-character password to `EMAIL_PASS` in `.env.local`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
shakya-labs/
├── src/
│   ├── App.jsx           # Main application component
│   ├── App.css           # Application styles
│   ├── index.css         # Global styles with Tailwind
│   ├── main.jsx          # Entry point
│   └── pages/
│       └── api/
│           └── sendMail.js  # Email API endpoint
├── public/               # Static assets
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
├── vite.config.js        # Vite configuration
├── .env.example          # Environment variables template
└── package.json          # Project dependencies

```

## Features

### Home Page
- Hero section with call-to-action
- Philosophy and services showcase
- Why Choose Us section
- Contact form with email integration
- Footer with links and special birthday button

### Birthday Page
- Countdown timer to special date
- Animated love story timeline
- Beautiful typography and animations
- Dark/Light mode support
- Bilingual content (English/Hindi)
- Confetti celebration button

### Contact Form
- Email validation
- Backend integration with Nodemailer
- Success/error messages
- Loading states

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.

## Author

Built with ❤️ by [Saurav](https://github.com/Sauravkumardotcom)

## Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with love and dedication to inspire excellence** 💝
