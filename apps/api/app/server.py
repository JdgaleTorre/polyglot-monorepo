from concurrent import futures

import grpc
from grpc_reflection.v1alpha import reflection

from app.models.task import init_db
from app.proto import task_pb2, task_pb2_grpc
from app.services.task_service import TaskServiceServicer

HOST = "[::]:50051"


def serve() -> None:
    init_db()

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    task_pb2_grpc.add_TaskServiceServicer_to_server(TaskServiceServicer(), server)

    service_names = (
        task_pb2.DESCRIPTOR.services_by_name["TaskService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(service_names, server)

    server.add_insecure_port(HOST)
    server.start()
    print(f"gRPC server listening on {HOST}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
