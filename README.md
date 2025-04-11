# Yuls2024-gifttracker-assignment3

A backend API project built with **Node.js** and **MySQL**, designed to manage gift ideas and recipient information for important occasions. It supports full CRUD operations on people and gifts, along with timeline features for upcoming events. The project includes interactive Swagger documentation and static interface mockups. Developed as part of **Assignment #3: API Endpoints and Documentation** for George Brown College’s Front-End Frameworks course.


**Live API Docs**: [GiftTracker Frontend Docs Page](https://yuls2024.github.io/Yuls2024-gifttracker-assignment3/)

**GitHub Repo**: [Yuls2024-gifttracker-assignment3](https://github.com/Yuls2024/Yuls2024-gifttracker-assignment3)

---

## Project Objectives

- Build a Node.js API that connects to a MySQL database.
- Design and expose multiple endpoints for managing people and gift data.
- Document the API using OpenAPI/Swagger.
- Provide rationale and UI mockups to illustrate how the API supports the application.

---

## Features

### People Management
- `GET /v1/people` – Retrieve all people
- `POST /v1/people` – Add a new person
- `GET /v1/people/{id}` – View details of a single person
- `PUT /v1/people/update` – Update a person’s information
- `PUT /v1/people/eliminate-by-info` – Soft-delete a person by name and relationship
- `GET /v1/people/search` – Search by name
- `GET /v1/people/relationship/{type}` – Filter by relationship type

### Gift Management
- `GET /v1/gifts` – View all gifts
- `GET /v1/gifts/{id}` – View a single gift

### Occasion & Timeline
- `GET /v1/occasions/names` – Retrieve all occasion names
- `GET /v1/occasions/timeline` – View upcoming gift-giving events with timelines

---

## Design Rationale

The GiftTracker API is built for a lightweight web app that helps users manage gifts and recipients across different events like birthdays or holidays. Key design goals included:

- **Usability**: Allow users to view all gifts and people quickly, with simple forms for entry/editing.
- **Data Accuracy**: Enable gift and person filtering using search and relationship criteria.
- **Extensibility**: Easy to add features like gift status filters or user login later.

---

## API Use Cases Demonstrated in Swagger

The API functionality is fully demonstrated through the interactive Swagger documentation. This includes structured access to endpoints for people, gifts, and upcoming occasions. 

---

## Technologies Used

- **Node.js** + **Express**
- **MySQL**
- **Swagger UI (OpenAPI)**
- **Hoppscotch** – for testing
- **GitHub Pages** – for documentation hosting

---

## How to Run Locally

1. Clone the repository  
   `git clone https://github.com/Yuls2024/Yuls2024-gifttracker-assignment3.git`

2. Install dependencies  
   `npm install`

3. Create a `.env` file in the root and configure MySQL credentials.

4. Start the server  
    `Wait for the initial Codespaces process to complete.`
     npm i nodemon -g
     nodemon backend/main.js
     `Thereafter, click on "Make Public" or use the "Ports" tab.`

5. Visit Swagger UI at  
   `https://yuls2024.github.io/Yuls2024-gifttracker-assignment3/`

---

## Assignment Submission Requirements

- GitHub repo link with full code
- Hosted frontend documentation page
- PDF document with:
  - Design rationale
  - API descriptions
  - Max 2 mockup images

---

## 📅 Deadline

🕒 **Due: April 14, 2025 at 11:59PM**  
📉 Late penalty: 10% (equivalent to 2% of final grade)

---

## 👩‍💻 Author

**Yulia Kostroma**  
[GitHub](https://github.com/yuls2024) • `yuliakostroma@hotmail.com`