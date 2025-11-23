// src/docker/createVM.js  (replace your current file)
const docker = require("./dockerClient"); // DO NOT destructure if dockerClient exports docker directly
const logger = require("../utils/logger");

function _chooseImageName(input) {
    // Accept several possible keys from payload for backward-compatibility.
    if (!input) return "ubuntu:latest";
    return input.image || input.oos || input.os || input.ostype || input;
}

function pullImage(image) {
    return new Promise((resolve, reject) => {
        if (!docker || typeof docker.pull !== "function") {
            return reject(new Error("docker_client_missing_pull"));
        }

        logger.info(`Pulling image ${image}... (this can take a while)`);
        docker.pull(image, (err, stream) => {
            if (err) return reject(err);

            // followProgress prints progress and resolves when done
            docker.modem.followProgress(
                stream,
                (err, output) => {
                    if (err) {
                        logger.error("Image pull failed:", err && err.message ? err.message : err);
                        return reject(err);
                    }
                    logger.success("Image pulled:", image);
                    resolve(output);
                },
                (event) => {
                    // event shows intermediate progress; log minimal useful info
                    if (event && (event.status || event.progress)) {
                        logger.info("pull:", event.id || "", event.status, event.progress || "");
                    }
                }
            );
        });
    });
}

async function createVM(imageInput = "ubuntu:latest", opts = {}) {
    const imageName = _chooseImageName(imageInput);
    try {
        if (!docker) throw new Error("docker_client_not_initialized");
        if (typeof docker.createContainer !== "function") throw new Error("docker_client_missing_createContainer");

        logger.info("Creating container with image:", imageName);

        // assemble create options
        const createOpts = {
            Image: imageName,
            Tty: true,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Cmd: ["/bin/bash"],
            ...opts.createOptions
        };

        // try to create
        const container = await docker.createContainer(createOpts);
        await container.start();
        logger.success("Container started:", container.id);

        return {
            success: true,
            vmId: container.id,
            message: "VM created successfully",
            name: container.id
        };
    } catch (err) {
        // detect "no such image" / 404 and attempt pull+retry
        const msg = String(err && err.message ? err.message : err);
        logger.error("createVM error:", msg);

        const isNoImage =
            msg.includes("no such image") ||
            msg.includes("no such container") || // sometimes docker-modem says container but means image
            (err && err.statusCode === 404);

        if (isNoImage) {
            try {
                await pullImage(imageName);
                // retry create
                logger.info("Retrying container create after pulling image...");
                const container = await docker.createContainer({
                    Image: imageName,
                    Tty: true,
                    AttachStdin: true,
                    AttachStdout: true,
                    AttachStderr: true,
                    Cmd: ["/bin/bash"],
                    ...opts.createOptions
                });
                await container.start();
                logger.success("Container started after pull:", container.id);

                return {
                    success: true,
                    vmId: container.id,
                    message: "VM created successfully (pulled image)",
                    name: container.id
                };
            } catch (err2) {
                logger.error("createVM retry error:", err2 && err2.message ? err2.message : err2);
                return {
                    success: false,
                    message: err2 && err2.message ? err2.message : String(err2)
                };
            }
        }

        // generic failure
        return {
            success: false,
            message: msg
        };
    }
}

module.exports = { createVM };
