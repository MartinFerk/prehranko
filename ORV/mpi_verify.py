from mpi4py import MPI
import numpy as np
import json
import socket

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

print(f"Rank {rank} tece na {socket.gethostname()}")

# 1. PRIPRAVA PODATKOV (Samo na Masterju)
test_embedding = None
chunks = None

if rank == 0:
    with open("mpi_input.json") as f:
        data = json.load(f)
    test_embedding = data["test_embedding"]
    # Razdelimo na toliko delov, kolikor je procesov (vkljucno z Masterjem)
    chunks = np.array_split(data["saved_embeddings"], size)
    chunks = [c.tolist() for c in chunks]

# 2. DISTRIBUCIJA (Vsi hkrati)
test_embedding = comm.bcast(test_embedding, root=0) # Pošlji vsem
my_chunk = comm.scatter(chunks, root=0) # Vsak dobi svoj del

# 3. IZRAČUN (Vsak na svojem računalniku)
my_sims = [cosine_similarity(test_embedding, e) for e in my_chunk]
print(f"Rank {rank} na {socket.gethostname()} je izracunal {len(my_sims)} podobnosti.")

# 4. ZBIRANJE REZULTATOV
all_results = comm.gather(my_sims, root=0)

if rank == 0:
    # Združimo sezname seznamov v en raven seznam
    flat_results = [item for sublist in all_results for item in sublist]
    avg_sim = sum(flat_results) / len(flat_results)
    print("\n===== MPI KONCNI REZULTAT =====")
    print(f"Skupno stevilo embeddingov: {len(flat_results)}")
    print(f"Povprecna podobnost: {avg_sim:.4f}")
    print(f"VERIFY SUCCESS: {avg_sim > 0.4}")