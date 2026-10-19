
const dateInput = document.getElementById("bookingDate");
const labGrid = document.getElementById("labGrid");
const bookingList = document.getElementById("bookingList");
const toast = document.getElementById("toast");

const today = localDateString();
dateInput.min = today;
dateInput.value = today;

function localDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function showMessage(message) {
    toast.textContent = message;
    toast.style.display = "block";
}

function formatTime(time) {
    const [hour, minute] = time.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

async function api(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed.");
    }

    return result.data;
}

function postJSON(action, data) {
    return api(`api.php?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

async function renderLabs() {
    labGrid.replaceChildren();

    const date = dateInput.value;
    if (!date) return;

    try {
        const slots = await api(
            `api.php?action=list&date=${encodeURIComponent(date)}`
        );

        document.getElementById("totalSlots").textContent = slots.length;

        const available = slots.filter(slot =>
            slot.status === "Available" && slot.slot_date >= today
        ).length;

        document.getElementById("availableSlots").textContent = available;

        slots.forEach(slot => {
            const card = document.createElement("article");
            card.className = "lab-card";

            const symbol = document.createElement("div");
            symbol.className = "lab-symbol";
            symbol.textContent = "💻";

            const heading = document.createElement("h3");
            heading.textContent = slot.lab_name;

            const details = document.createElement("p");
            details.textContent =
                `Slot ID: ${slot.id} · ${slot.slot_date} · ` +
                `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`;

            const status = document.createElement("span");
            const isAvailable =
                slot.status === "Available" && slot.slot_date >= today;

            status.className = isAvailable ? "status" : "status booked";
            status.textContent = isAvailable ? "Available" : "Booked / Unavailable";

            const button = document.createElement("button");
            button.className = "book-btn";
            button.textContent = "Book Slot";
            button.disabled = !isAvailable;

            button.addEventListener("click", () => bookSlot(slot));

            card.append(symbol, heading, details, status, button);
            labGrid.appendChild(card);
        });

        if (slots.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty";
            empty.textContent = "No slots found for this date.";
            labGrid.appendChild(empty);
        }

    } catch (error) {
        showMessage(error.message);
    }
}

async function bookSlot(slot) {
    const name = prompt("Enter your full name:");
    if (!name || !name.trim()) return;

    const roll = prompt("Enter your roll number:");
    if (!roll || !roll.trim()) return;

    try {
        await postJSON("book", {
            slot_id: slot.id,
            student_name: name.trim(),
            roll_no: roll.trim()
        });

        showMessage("Booking saved successfully in the database.");
        await renderLabs();

        document.getElementById("rollLookup").value = roll.trim();
        await findBookings();

    } catch (error) {
        showMessage(error.message);
        await renderLabs();
    }
}

async function findBookings() {
    const roll = document.getElementById("rollLookup").value.trim();

    if (!roll) {
        showMessage("Enter your roll number first.");
        return;
    }

    bookingList.replaceChildren();

    try {
        const bookings = await postJSON("my_bookings", {
            roll_no: roll
        });

        document.getElementById("myBookingsCount").textContent =
            bookings.length;

        if (bookings.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty";
            empty.textContent = "No bookings found for this roll number.";
            bookingList.appendChild(empty);
            return;
        }

        bookings.forEach(booking => {
            const card = document.createElement("article");
            card.className = "booking-card";

            const heading = document.createElement("h3");
            heading.textContent = booking.lab_name;

            const details = document.createElement("p");
            details.textContent =
                `Slot ID: ${booking.id} · ${booking.student_name} · ` +
                `${booking.slot_date} · ${formatTime(booking.start_time)}`;

            const cancel = document.createElement("button");
            cancel.className = "cancel-btn";
            cancel.textContent = "Cancel Booking";

            cancel.addEventListener("click", async () => {
                if (!confirm("Cancel this laboratory booking?")) return;

                try {
                    await postJSON("cancel", {
                        slot_id: booking.id,
                        roll_no: roll
                    });

                    showMessage("Booking cancelled successfully.");
                    await renderLabs();
                    await findBookings();

                } catch (error) {
                    showMessage(error.message);
                }
            });

            card.append(heading, details, cancel);
            bookingList.appendChild(card);
        });

    } catch (error) {
        showMessage(error.message);
    }
}

dateInput.addEventListener("change", renderLabs);

document.getElementById("findBookings")
    .addEventListener("click", findBookings);

renderLabs();
