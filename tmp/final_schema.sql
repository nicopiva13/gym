-- Limpiar tablas existentes para evitar conflictos
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS plan_day_exercises, plan_days, client_training_plans, training_plans, exercises, weekly_goals, attendances, payments, client_memberships, membership_plans, clients, users, gym_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Usuarios del sistema (owner y entrenadores)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  lastname VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  username VARCHAR(80) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('owner','trainer'),
  phone VARCHAR(30),
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clientes / socios (login solo por DNI)
CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trainer_id INT,
  name VARCHAR(100),
  lastname VARCHAR(100),
  dni VARCHAR(20) UNIQUE,
  email VARCHAR(150),
  phone VARCHAR(30),
  birthdate DATE,
  goal TEXT,
  photo_url VARCHAR(255),
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Planes de membresía
CREATE TABLE membership_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  duration_days INT,
  active TINYINT(1) DEFAULT 1
);

-- 4. Membresía activa del cliente
CREATE TABLE client_memberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  plan_id INT,
  start_date DATE,
  end_date DATE,
  status ENUM('active','expired','frozen','cancelled') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
);

-- 5. Pagos registrados
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  membership_id INT,
  amount DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2),
  method ENUM('cash','transfer','card'),
  notes TEXT,
  registered_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  voided TINYINT(1) DEFAULT 0,
  void_reason TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (membership_id) REFERENCES client_memberships(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

-- 6. Asistencias
CREATE TABLE attendances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  registered_by INT,
  check_in DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

-- 7. Seguimiento semanal de objetivos
CREATE TABLE weekly_goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  trainer_id INT,
  week_start DATE,
  met_goal TINYINT(1) DEFAULT 0,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- 8. Biblioteca de ejercicios
CREATE TABLE exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trainer_id INT,
  name VARCHAR(150),
  muscle_group ENUM('chest','back','legs','shoulders','biceps','triceps','abs','cardio','full_body','other'),
  measurement_type ENUM('reps','time'),
  description TEXT,
  youtube_url VARCHAR(255),
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- 9. Planes de entrenamiento
CREATE TABLE training_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trainer_id INT,
  name VARCHAR(150),
  description TEXT,
  status ENUM('draft','active') DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- 10. Asignación de plan a cliente
CREATE TABLE client_training_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  training_plan_id INT,
  start_date DATE,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (training_plan_id) REFERENCES training_plans(id)
);

-- 11. Días del plan
CREATE TABLE plan_days (
  id INT PRIMARY KEY AUTO_INCREMENT,
  training_plan_id INT,
  day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
  label VARCHAR(50),
  FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

-- 12. Ejercicios por día
CREATE TABLE plan_day_exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plan_day_id INT,
  exercise_id INT,
  sort_order INT DEFAULT 0,
  sets INT,
  reps INT,
  weight_kg DECIMAL(6,2),
  weight_is_free TINYINT(1) DEFAULT 0,
  duration_value INT,
  duration_unit ENUM('seconds','minutes'),
  rest_seconds INT,
  notes TEXT,
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- 13. Configuración
CREATE TABLE gym_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE,
  setting_value TEXT
);

-- DATA DE EJEMPLO (Password: '1234' -> $2y$10$8K1QO0W5pA/3m0A6X5rM9.8U8Y8...)
INSERT INTO users (name, lastname, email, username, password_hash, role) VALUES 
('Admin', 'Gym', 'admin@gym.com', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner'),
('Trainer', 'One', 'trainer@gym.com', 'trainer1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer');

INSERT INTO membership_plans (name, description, price, duration_days) VALUES 
('Musculación', 'Acceso ilimitado a sala de pesas', 15000.00, 30),
('Full Pass', 'Pesas + Clases Grupales', 22000.00, 30);

INSERT INTO clients (trainer_id, name, lastname, dni, email) VALUES 
(2, 'Juan', 'Perez', '33333333', 'juan@test.com'),
(2, 'Maria', 'Gomez', '44444444', 'maria@test.com');

INSERT INTO exercises (trainer_id, name, muscle_group, measurement_type) VALUES 
(2, 'Press de Banca', 'chest', 'reps'),
(2, 'Sentadillas', 'legs', 'reps'),
(2, 'Plancha', 'abs', 'time');
