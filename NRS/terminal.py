import socket
import threading
import requests
import tkinter as tk
from tkinter import messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# --- KONFIGURACIJA ---
API_URL = "https://prehranko-production.up.railway.app/api/auth/update-temp"
SOBNA_RAW = 2000
SOBNA_TEMP = 23.0
OBCHUTLJIVOST = 4.3


class PrehrankoGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Prehranko - STM32 Terminal + Graph")
        self.root.geometry("500x700")

        self.bg_color = "#2b2b2b"
        self.text_color = "#ffffff"
        self.accent_color = "#ccb343"
        self.history = [SOBNA_TEMP] * 10  # Zadnjih 10 vrednosti

        self.root.configure(bg=self.bg_color)

        # 1. NASLOV IN EMAIL
        tk.Label(root, text="PREHRANKO", font=("Arial", 16, "bold"),
                 fg=self.accent_color, bg=self.bg_color).pack(pady=10)

        tk.Label(root, text="Email uporabnika:", font=("Arial", 10),
                 fg=self.text_color, bg=self.bg_color).pack()
        self.email_entry = tk.Entry(root, font=("Arial", 12), width=30,
                                    bg="#3d3d3d", fg="white", insertbackground="white", borderwidth=0)
        self.email_entry.insert(0, "vnesi@email.si")
        self.email_entry.pack(pady=5)

        # 2. PRIKAZ TEMPERATURE
        self.temp_var = tk.StringVar(value="--.- °C")
        self.raw_var = tk.StringVar(value="RAW: ----")

        tk.Label(root, textvariable=self.temp_var, font=("Arial", 45, "bold"),
                 fg=self.text_color, bg=self.bg_color).pack(pady=5)
        tk.Label(root, textvariable=self.raw_var, font=("Arial", 12),
                 fg=self.accent_color, bg=self.bg_color).pack()

        # 3. GUMB ZA SHRANJEVANJE
        self.update_btn = tk.Button(root, text="SHRANI V API", command=self.manual_update,
                                    bg=self.accent_color, fg=self.bg_color, font=("Arial", 10, "bold"),
                                    activebackground="#ffb167", cursor="hand2", borderwidth=0, padx=20, pady=10)
        self.update_btn.pack(pady=15)

        # 4. GRAF (Matplotlib)

        self.fig, self.ax = plt.subplots(figsize=(4, 3), dpi=100)
        self.fig.patch.set_facecolor(self.bg_color)
        self.ax.set_facecolor(self.bg_color)

        self.line, = self.ax.plot(self.history, color=self.accent_color, linewidth=2, marker='o', markersize=4)

        # Oblikovanje osi grafa
        self.ax.spines['bottom'].set_color(self.text_color)
        self.ax.spines['left'].set_color(self.text_color)
        self.ax.tick_params(axis='x', colors=self.text_color)
        self.ax.tick_params(axis='y', colors=self.text_color)
        self.ax.set_ylim(15, 30)  # Nastavi fiksno skalo za temperaturo

        self.canvas = FigureCanvasTkAgg(self.fig, master=self.root)
        self.canvas.get_tk_widget().pack(pady=10, fill=tk.BOTH, expand=True)

        # 5. STATUS BAR
        self.status_var = tk.StringVar(value="Status: Čakam na podatke...")
        self.status_label = tk.Label(root, textvariable=self.status_var, font=("Arial", 9, "italic"),
                                     fg="#a0a0a0", bg=self.bg_color)
        self.status_label.pack(side="bottom", pady=5)

        # Zagon TCP strežnika
        self.listen_thread = threading.Thread(target=self.start_listening, daemon=True)
        self.listen_thread.start()

    def start_listening(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server.bind(('0.0.0.0', 5000))
            server.listen(5)
            while True:
                client, addr = server.accept()
                threading.Thread(target=self.handle_client, args=(client, addr), daemon=True).start()
        except Exception as e:
            self.root.after(0, lambda: self.status_var.set(f"Status: Napaka strežnika: {e}"))

    def handle_client(self, client, addr):
        print(f"[*] Naprava povezana: {addr}")
        buffer = ""
        try:
            while True:
                chunk = client.recv(1024).decode('utf-8')
                if not chunk: break
                buffer += chunk
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    if "RAW:" in line:
                        try:
                            raw_val = int(line.split(":")[1].strip())
                            temp_c = self.calculate_temp(raw_val)
                            self.root.after(0, self.update_ui, raw_val, temp_c)
                        except:
                            continue
        except Exception:
            pass
        finally:
            client.close()

    def calculate_temp(self, raw_val):
        diff = SOBNA_RAW - raw_val
        return SOBNA_TEMP + (diff / OBCHUTLJIVOST)

    def update_ui(self, raw, temp):
        # Posodobi številke
        self.temp_var.set(f"{temp:.1f} °C")
        self.raw_var.set(f"RAW: {raw}")

        # Posodobi zgodovino za graf
        self.history.append(temp)
        self.history = self.history[-10:]  # Obdrži le zadnjih 10

        # Osveži črto na grafu
        self.line.set_ydata(self.history)
        self.ax.relim()
        self.ax.autoscale_view(scalex=False, scaley=True)
        self.canvas.draw()

    def manual_update(self):
        try:
            t_str = self.temp_var.get().replace(" °C", "")
            if t_str != "--.-":
                self.send_to_railway(float(t_str))
        except:
            pass

    def send_to_railway(self, temp):
        email = self.email_entry.get().strip()

        def worker():
            try:
                payload = {"email": email, "temperature": round(temp, 2)}
                res = requests.post(API_URL, json=payload, timeout=8)
                msg = "Uspešno poslano!" if res.status_code == 200 else f"API Error {res.status_code}"
                self.status_var.set(f"Status: {msg}")
            except:
                self.status_var.set("Status: Ni povezave z Railway!")

        threading.Thread(target=worker, daemon=True).start()


if __name__ == "__main__":
    root = tk.Tk()
    app = PrehrankoGUI(root)
    root.mainloop()