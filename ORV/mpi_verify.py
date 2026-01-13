# mpi_verify.py
from mpi4py import MPI
import numpy as np
import json
import sys
import os
import socket # Dodaj za izpis imena hosta

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

# Izpiši, kateri rank teče na kateri napravi
print(f"Rank {rank} tece na {socket.gethostname()}", flush=True)

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

input_file = sys.argv[1] if len(sys.argv) > 1 else "mpi_input.json"

test_embedding = None
chunks = None
result_file = "mpi_result.json"

if rank == 0:
    with open(input_file) as f:
        data = json.load(f)
    test_embedding = data["test_embedding"]
    result_file = data.get("result_file", "mpi_result.json")
    chunks = np.array_split(data["saved_embeddings"], size)
    chunks = [c.tolist() for c in chunks]

test_embedding = comm.bcast(test_embedding, root=0)
result_file = comm.bcast(result_file, root=0)
my_chunk = comm.scatter(chunks, root=0)

# Izračunaj in izpiši napredek posameznega ranka
my_sims = [cosine_similarity(test_embedding, e) for e in my_chunk]
print(f"Rank {rank} na {socket.gethostname()} je izracunal {len(my_sims)} podobnosti.", flush=True)

all_results = comm.gather(my_sims, root=0)

if rank == 0:
    flat_results = [item for sublist in all_results for item in sublist]
    avg_sim = sum(flat_results) / len(flat_results) if flat_results else 0
    success = avg_sim > 0.4

    print("\n===== MPI KONCNI REZULTAT =====", flush=True)
    print(f"Skupno stevilo embeddingov: {len(flat_results)}", flush=True)
    print(f"Povprecna podobnost: {avg_sim:.4f}", flush=True)
    print(f"VERIFY SUCCESS: {success}", flush=True)

    output_data = {"success": success, "avg_similarity": avg_sim}
    with open(result_file, "w") as f:
        json.dump(output_data, f)