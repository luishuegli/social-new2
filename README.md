# The Social Portfolio

> *An activity-first social platform designed to combat digital isolation through real-world experiences and authentic connections.*

## 🎯 Core Vision: A Strava for Life

**The Social Portfolio** is fundamentally reimagining social networking by placing activities—not followers or static profiles—at the center of human connection. We're building a platform where an individual's identity is defined by their real-world adventures and the genuine relationships that emerge from shared experiences.

This isn't another social media platform; it's a **utility for a better social life**. Your profile becomes a "Social Portfolio"—a rich, visual résumé of your life's adventures that serves as an authentic foundation for forming new connections and communities.

---

## 📜 Guiding Philosophy: Our Constitution

**All development must adhere to these core principles:**

### 1. **Activity is the Proof-of-Work**
- All meaningful content must be tied to a tangible activity
- We structurally reject low-effort content through an "Activity-Gated" posting mechanism
- **A post cannot exist without a defined activity behind it**

### 2. **The Individual Post is the Foundation of the Portfolio**
- Solo activity posts are the essential building blocks of authentic identity
- They serve as a "CV for your life's adventures"
- Showcase passions and skills, making users compelling candidates for joining new groups

### 3. **Shared Experience is the Highest Form of Connection**
- While solo activities build the foundation, shared experiences are the ultimate goal
- Collaborative "Live Posts" created by groups using "Activity Mode" are systematically elevated
- These represent the platform's most valuable content

### 4. **Rejecting Passive Consumption**
- We're building a utility for active participants
- Features encourage planning, doing, sharing, and connecting—not mindless scrolling
- Every interaction should move users toward real-world experiences

---

## 🏗️ Core Features Overview

### **🏠 Home Feed**
A unified, chronological feed with strong visual hierarchy that elevates collaborative "Live Posts" above individual content.

### **⚡ Action Center**
The user's command center for social logistics:
- **Messages**: Direct conversations and group chats
- **Requests & Invites**: Group invitations and join requests
- **Planning**: Activity polls and collaborative planning tools

### **👥 Groups Dashboard**
Visually rich showcase of user's communities featuring:
- Prominent "Featured Group" card (next upcoming activity)
- Responsive grid of standard group cards with stacked member avatars

### **📅 Calendar**
Clean aggregation of all finalized, upcoming activities across groups and solo plans.

### **➕ New Post Button**
Primary entry point for the "Activity-Gated" posting flow—ensuring every post has real-world substance.

### **👤 The Social Portfolio (User Profile)**
A user's comprehensive portfolio aggregating all posts (solo and group) to create a rich tapestry of their life's activities and experiences.

---

## 🛠️ Technical Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Backend & Database** | Google Firebase (Auth, Firestore, Storage) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |

---

## 🎨 Design System

### **"Focused Clarity"**
Our minimalist design philosophy emphasizing:
- **Dark Theme**: Reduces eye strain and creates premium feel
- **Purposeful Typography**: Clear hierarchy with semantic meaning
- **Consistent Spacing**: Systematic rhythm throughout the interface
- **Calm & Intuitive UX**: Every element serves a clear purpose

### **"Liquid Glass" UI**
Primary container elements feature:
- **Hyper-realistic blur effects**: Semi-transparent depth and layering
- **Contextual awareness**: Background visibility maintains spatial orientation
- **Apple-inspired**: Modern, premium aesthetic with functional beauty
- **Beveled edges**: Subtle lighting effects for tactile realism

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` to see the application.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── home/              # Live Posts feed
│   ├── groups/            # Groups dashboard & detail pages
│   ├── action-center/     # Messages, requests, planning
│   ├── profile/           # User Social Portfolios
│   ├── calendar/          # Activity calendar
│   ├── components/        # Core app components
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Mock data & utilities
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (LiquidGlass, etc.)
│   ├── GroupCard.jsx     # Group display components
│   ├── PostCard.jsx      # Activity post components
│   └── ...               # Feature-specific components
└── ...
```

---

## 🎯 Key Principles for Development

### **Activity-Gated Content**
- Every post must be associated with a real activity
- No generic "thoughts" or low-effort content
- Activity details drive the posting interface

### **Visual Hierarchy**
- Collaborative group posts > Individual posts
- Active/upcoming activities > Past activities
- Real photos/media > Text-only content

### **Authentic Identity**
- Profiles built from actual experiences
- Skills and interests demonstrated through activities
- Connection opportunities based on shared activity interests

### **Real-World Focus**
- Features should encourage offline meetups
- Digital interactions should facilitate physical experiences
- Success metrics based on real-world activity participation

---

## 🔮 Vision for the Future

**The Social Portfolio** aims to become the definitive platform for:
- **Activity Discovery**: Finding new experiences and hobbies
- **Community Building**: Forming groups around shared interests
- **Skill Development**: Learning and growing through activities
- **Authentic Connection**: Meeting people through genuine shared experiences
- **Life Documentation**: Building a rich portfolio of life's adventures

---

## 🤝 Contributing

When contributing to this project, always ask:
1. Does this feature encourage real-world activity?
2. Does this strengthen authentic human connections?
3. Does this align with our anti-passive-consumption philosophy?
4. Does this maintain the "Focused Clarity" design principles?

---

## 📝 License

This project represents a new vision for social networking—one that prioritizes real experiences over digital validation, authentic connections over follower counts, and active participation over passive consumption.

---

*"Your life's adventures deserve a better platform."*