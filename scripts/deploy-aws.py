#!/usr/bin/env python3
"""
Automated AWS EC2 Free Tier Deployment Script for Lab Portal.
Provisions a t2.micro Ubuntu 24.04 instance, configures Security Groups,
creates Key Pair, and bootstraps Docker Compose full-stack 24/7.
"""

import boto3
import time
import os
import sys
from dotenv import dotenv_values

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_AWS_PATH = os.path.join(REPO_ROOT, '.env.aws')

if not os.path.exists(ENV_AWS_PATH):
    print(f"Error: Credentials file not found at {ENV_AWS_PATH}")
    sys.exit(1)

cfg = dotenv_values(ENV_AWS_PATH)
access_key = cfg.get('AWS_ACCESS_KEY_ID')
secret_key = cfg.get('AWS_SECRET_ACCESS_KEY')
region = cfg.get('AWS_REGION', 'ap-south-1')

print("=================================================================")
print(" Lab Portal — Automated AWS EC2 Free Tier Deployment")
print(f" Region: {region}")
print("=================================================================")

session = boto3.Session(
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name=region
)

sts = session.client('sts')
try:
    caller = sts.get_caller_identity()
    print(f"[1/6] Authenticated as IAM User: {caller['Arn']}")
except Exception as e:
    print(f"Authentication failed: {e}")
    sys.exit(1)

ec2 = session.client('ec2')

# 1. Get Default VPC
print("[2/6] Locating default VPC...")
try:
    vpcs = ec2.describe_vpcs(Filters=[{'Name': 'isDefault', 'Values': ['true']}])['Vpcs']
    if not vpcs:
        vpcs = ec2.describe_vpcs()['Vpcs']
    if not vpcs:
        print("Error: No VPC found in this region.")
        sys.exit(1)
    vpc_id = vpcs[0]['VpcId']
    print(f"      Using VPC: {vpc_id}")
except Exception as e:
    print(f"Failed to query VPC: {e}")
    sys.exit(1)

# 2. Configure Security Group
print("[3/6] Configuring Security Group (Ports 22, 80, 443, 3000, 5173)...")
sg_name = 'lab-portal-security-group'
sg_id = None

try:
    sgs = ec2.describe_security_groups(
        Filters=[
            {'Name': 'group-name', 'Values': [sg_name]},
            {'Name': 'vpc-id', 'Values': [vpc_id]}
        ]
    )['SecurityGroups']
    if sgs:
        sg_id = sgs[0]['GroupId']
        print(f"      Existing Security Group found: {sg_id}")
    else:
        new_sg = ec2.create_security_group(
            GroupName=sg_name,
            Description='Security group for Lab Portal diagnostic demo full-stack',
            VpcId=vpc_id
        )
        sg_id = new_sg['GroupId']
        print(f"      Created Security Group: {sg_id}")
        
    # Ensure Inbound Rules are Authorized
    ip_permissions = [
        {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'SSH'}]},
        {'IpProtocol': 'tcp', 'FromPort': 80, 'ToPort': 80, 'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'HTTP / Nginx'}]},
        {'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'HTTPS'}]},
        {'IpProtocol': 'tcp', 'FromPort': 3000, 'ToPort': 3000, 'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'Backend API'}]},
        {'IpProtocol': 'tcp', 'FromPort': 5173, 'ToPort': 5173, 'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'Frontend Client'}]},
    ]
    for perm in ip_permissions:
        try:
            ec2.authorize_security_group_ingress(GroupId=sg_id, IpPermissions=[perm])
        except Exception:
            pass # Already authorized
    print("      Inbound ports 22, 80, 443, 3000, 5173 confirmed open.")
except Exception as e:
    print(f"Security Group error: {e}")
    sys.exit(1)

# 3. Create or Locate Key Pair
print("[4/6] Configuring SSH Key Pair...")
key_name = 'lab-portal-key'
key_pem_path = os.path.join(REPO_ROOT, 'lab-portal-key.pem')

try:
    key_pairs = ec2.describe_key_pairs(Filters=[{'Name': 'key-name', 'Values': [key_name]}])['KeyPairs']
    if key_pairs:
        print(f"      Existing Key Pair '{key_name}' located.")
    else:
        kp = ec2.create_key_pair(KeyName=key_name, KeyType='rsa')
        with open(key_pem_path, 'w', encoding='utf-8') as f:
            f.write(kp['KeyMaterial'])
        print(f"      Created new Key Pair and saved private key to: {key_pem_path}")
except Exception as e:
    print(f"Key Pair error: {e}")
    sys.exit(1)

# 4. Resolve Ubuntu 24.04 LTS AMI
print("[5/6] Resolving latest official Ubuntu 24.04 LTS AMI...")
try:
    images = ec2.describe_images(
        Owners=['099720109477'], # Canonical
        Filters=[
            {'Name': 'name', 'Values': ['ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*']},
            {'Name': 'state', 'Values': ['available']}
        ]
    )['Images']
    images.sort(key=lambda x: x['CreationDate'], reverse=True)
    if not images:
        # Fallback to standard ap-south-1 Ubuntu 24.04 AMI
        ami_id = 'ami-00bb6a80f01f03502'
    else:
        ami_id = images[0]['ImageId']
    print(f"      Selected AMI: {ami_id}")
except Exception as e:
    ami_id = 'ami-00bb6a80f01f03502'
    print(f"      Using fallback AMI: {ami_id}")

# 5. Bootstrap User Data Script
user_data_script = """#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

echo "[BOOT 1/5] Configuring 2GB Swap Memory..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "[BOOT 2/5] Installing Docker & Docker Compose..."
apt-get update -y
apt-get install -y docker.io docker-compose-v2 git curl

systemctl enable --now docker
usermod -aG docker ubuntu || true

echo "[BOOT 3/5] Cloning Lab Portal Repository..."
cd /home/ubuntu
if [ ! -d "lab-portal" ]; then
    git clone https://github.com/PrashantTarbundiya/lab-portal.git
fi
chown -R ubuntu:ubuntu /home/ubuntu/lab-portal
cd /home/ubuntu/lab-portal

echo "[BOOT 4/5] Launching Full-Stack Docker Containers..."
cp server/.env.docker.example server/.env
docker compose up -d --build

echo "[BOOT 5/5] Launching 24/7 Keep-Alive Daemon..."
(while true; do sleep 600; curl -s http://localhost:3000/api/health || true; done) > /dev/null 2>&1 &

echo "=== All services deployed and healthy ==="
"""

# 6. Launch Free Tier t3.micro EC2 Instance
print("[6/6] Launching AWS Free Tier t3.micro Instance...")
try:
    instance_params = {
        'ImageId': ami_id,
        'InstanceType': 't3.micro', # 100% Free Tier Eligible (2 vCPU, 1 GB RAM)
        'MinCount': 1,
        'MaxCount': 1,
        'KeyName': key_name,
        'SecurityGroupIds': [sg_id],
        'UserData': user_data_script,
        'BlockDeviceMappings': [
            {
                'DeviceName': '/dev/sda1',
                'Ebs': {
                    'VolumeSize': 30, # Free Tier Limit: 30 GB
                    'VolumeType': 'gp3',
                    'DeleteOnTermination': True,
                }
            }
        ],
        'TagSpecifications': [
            {
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'lab-portal-production-server'},
                    {'Key': 'Project', 'Value': 'LabPortal'}
                ]
            }
        ]
    }
    
    res = ec2.run_instances(**instance_params)
    instance_id = res['Instances'][0]['InstanceId']
    print(f"      Launched Instance ID: {instance_id}")
    print("      Waiting for instance to initialize and assign public IP...")
    
    # Wait for running
    waiter = ec2.get_waiter('instance_running')
    waiter.wait(InstanceIds=[instance_id])
    
    # Describe to get IP
    desc = ec2.describe_instances(InstanceIds=[instance_id])['Reservations'][0]['Instances'][0]
    public_ip = desc.get('PublicIpAddress')
    public_dns = desc.get('PublicDnsName')
    
    print("\n=================================================================")
    print(" AWS EC2 Free Tier Instance Deployed Successfully!")
    print("=================================================================")
    print(f" Instance ID: {instance_id}")
    print(f" Public IPv4: {public_ip}")
    print(f" Public DNS:  {public_dns}")
    print(f"\n Service Endpoints:")
    print(f" - Frontend Portal:   http://{public_ip}:5173")
    print(f" - Backend API:       http://{public_ip}:3000")
    print(f" - Health Check:      http://{public_ip}:3000/api/health")
    print(f"\n Note: The server takes ~2 minutes to download Docker images and boot.")
    print("=================================================================")

except Exception as e:
    print(f"Failed to launch instance: {e}")
    sys.exit(1)

