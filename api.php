
<?php
header("Content-Type: application/json; charset=UTF-8");


$host = "127.0.0.1";
$port = 3306;
$dbname = "lab_booking";
$username = "root";
$password = "saigeethika";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed. Check database credentials and setup."
    ]);
    exit;
}


function respond($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    $result = ["success" => $success, "message" => $message];

    if ($data !== null) {
        $result["data"] = $data;
    }

    echo json_encode($result);
    exit;
}

$action = $_GET["action"] ?? "";

try {
    if ($action === "list") {
        $date = $_GET["date"] ?? date("Y-m-d");

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            respond(false, "Invalid date.", null, 400);
        }

        $stmt = $pdo->prepare(
            "SELECT id, lab_name, slot_date, start_time, end_time, status
             FROM slots
             WHERE slot_date = ?
             ORDER BY start_time, lab_name"
        );
        $stmt->execute([$date]);

        respond(true, "Slots loaded.", $stmt->fetchAll());
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        respond(false, "Unsupported request method.", null, 405);
    }

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        respond(false, "Invalid JSON request.", null, 400);
    }

    if ($action === "book") {
        $id = filter_var($input["slot_id"] ?? null, FILTER_VALIDATE_INT);
        $name = trim($input["student_name"] ?? "");
        $roll = trim($input["roll_no"] ?? "");

        if (!$id || $name === "" || $roll === ""
            || strlen($name) > 100 || strlen($roll) > 30) {
            respond(false, "Enter a valid slot ID, name, and roll number.", null, 400);
        }

        $stmt = $pdo->prepare(
            "UPDATE slots
             SET status = 'Booked', student_name = ?, roll_no = ?
             WHERE id = ? AND status = 'Available'
             AND slot_date >= CURDATE()"
        );

        $stmt->execute([$name, $roll, $id]);

        if ($stmt->rowCount() !== 1) {
            respond(false, "This slot is already booked or has expired.", null, 409);
        }

        respond(true, "Slot booked successfully.");
    }

    if ($action === "my_bookings") {
        $roll = trim($input["roll_no"] ?? "");

        if ($roll === "" || strlen($roll) > 30) {
            respond(false, "Enter a valid roll number.", null, 400);
        }

        $stmt = $pdo->prepare(
            "SELECT id, lab_name, slot_date, start_time, end_time, student_name
             FROM slots
             WHERE status = 'Booked' AND roll_no = ?
             ORDER BY slot_date, start_time"
        );
        $stmt->execute([$roll]);

        respond(true, "Bookings loaded.", $stmt->fetchAll());
    }

    if ($action === "cancel") {
        $id = filter_var($input["slot_id"] ?? null, FILTER_VALIDATE_INT);
        $roll = trim($input["roll_no"] ?? "");

        if (!$id || $roll === "") {
            respond(false, "Enter the slot ID and roll number.", null, 400);
        }

        $stmt = $pdo->prepare(
            "UPDATE slots
             SET status = 'Available', student_name = NULL, roll_no = NULL
             WHERE id = ? AND roll_no = ? AND status = 'Booked'
             AND slot_date >= CURDATE()"
        );
        $stmt->execute([$id, $roll]);

        if ($stmt->rowCount() !== 1) {
            respond(false, "Booking not found or cancellation not permitted.", null, 404);
        }

        respond(true, "Booking cancelled successfully.");
    }

    respond(false, "Unknown action.", null, 400);

} catch (PDOException $e) {
    respond(false, "A database operation failed.", null, 500);
}
