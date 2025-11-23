# Decentralized Cloud Market Place! 🚀

We successfully developed a platform that leverages untapped computational capacity from individual or institutional machines, turning them into rentable compute nodes. This innovative, community-based model is designed to make customizable, on-demand virtual machines significantly more affordable and accessible for students, researchers, and developers compared to conventional centralized cloud vendors.

Key Project Highlights & Tech Stack

The project functions as a robust IaaS/SaaS solution, featuring a central backend server, distributed client agents, and a multi-tenant user dashboard.

Core Isolation & Orchestration: We utilized Docker and Kubernetes to ensure high isolation and effective resource utilization for VM instances.

Real-Time Coordination: WebSocket's were critical for real-time communication, coordinating VM lifecycle activities and sharing live status metrics between the backend and distributed worker agents (PCs).

Backend Logic: Built with Node.js and Express.js, the server handles resource allocation using scheduling algorithms.

User Interface: The React.js SaaS Dashboard provides a seamless experience for VM configuration, monitoring, and command execution.

Security: Authentication is secured with a two-step, OTP-based login and JWT for authorization.

Database: MongoDB is used to store all metadata, including user accounts, VM configurations, and operational logs.

Watch the full end-to-end demo, showcasing VM creation, real-time status updates, and terminal access:

https://youtu.be/6Xf9dl8fGsM
